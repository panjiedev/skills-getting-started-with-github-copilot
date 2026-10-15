document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  let activityData = {};

  function renderActivities() {
    activitiesList.replaceChildren();

    while (activitySelect.options.length > 1) {
      activitySelect.remove(1);
    }

    Object.entries(activityData).forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const heading = document.createElement("h4");
      heading.textContent = name;
      activityCard.appendChild(heading);

      const description = document.createElement("p");
      description.textContent = details.description;
      activityCard.appendChild(description);

      const schedule = document.createElement("p");
      const scheduleLabel = document.createElement("strong");
      scheduleLabel.textContent = "Schedule: ";
      schedule.append(scheduleLabel, document.createTextNode(details.schedule));
      activityCard.appendChild(schedule);

      const spotsLeft = details.max_participants - details.participants.length;
      const availability = document.createElement("p");
      const availabilityLabel = document.createElement("strong");
      availabilityLabel.textContent = "Availability: ";
      availability.append(
        availabilityLabel,
        document.createTextNode(`${spotsLeft} spots left`)
      );
      activityCard.appendChild(availability);

      const participantsHeading = document.createElement("h5");
      participantsHeading.textContent = "Registered participants";
      activityCard.appendChild(participantsHeading);

      const participantsList = document.createElement("ul");
      participantsList.className = "participants-list";
      details.participants.forEach((email) => {
        const participant = document.createElement("li");
        const participantEmail = document.createElement("span");
        participantEmail.textContent = email;

        const unregisterButton = document.createElement("button");
        unregisterButton.type = "button";
        unregisterButton.className = "unregister-button";
        unregisterButton.setAttribute("aria-label", `Unregister ${email} from ${name}`);
        unregisterButton.textContent = "×";

        participant.append(participantEmail, unregisterButton);
        participantsList.appendChild(participant);
      });
      activityCard.appendChild(participantsList);
      activitiesList.appendChild(activityCard);

      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      if (!response.ok) {
        throw new Error(`Failed to load activities: ${response.status}`);
      }
      activityData = await response.json();
      renderActivities();
    } catch (error) {
      activitiesList.replaceChildren();
      const errorMessage = document.createElement("p");
      errorMessage.textContent = "Failed to load activities. Please try again later.";
      activitiesList.appendChild(errorMessage);
      console.error("Error fetching activities:", error);
    }
  }

  function showMessage(message, isError = false) {
    messageDiv.textContent = message;
    messageDiv.className = isError ? "error" : "success";
    messageDiv.classList.remove("hidden");
    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        activityData[activity].participants.push(email);
        renderActivities();
        showMessage(result.message);
        signupForm.reset();
      } else {
        showMessage(result.detail || "An error occurred", true);
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", true);
      console.error("Error signing up:", error);
    }
  });

  activitiesList.addEventListener("click", async (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const button = event.target.closest(".unregister-button");
    if (!button) {
      return;
    }

    const participant = button.closest("li");
    const activityCard = button.closest(".activity-card");
    const activityName = activityCard.querySelector("h4").textContent;
    const email = participant.querySelector("span").textContent;
    button.disabled = true;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/signup?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );
      const result = await response.json();

      if (!response.ok) {
        showMessage(result.detail || "An error occurred", true);
        return;
      }

      const participants = activityData[activityName].participants;
      for (let index = participants.length - 1; index >= 0; index -= 1) {
        if (participants[index] === email) {
          participants.splice(index, 1);
        }
      }
      renderActivities();
      showMessage(result.message);
    } catch (error) {
      showMessage("Failed to unregister. Please try again.", true);
      console.error("Error unregistering participant:", error);
    } finally {
      button.disabled = false;
    }
  });

  // Initialize app
  fetchActivities();
});
