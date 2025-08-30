(function () {
  emailjs.init("cEGpAPPia1CNnfoyh");
})();
document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector(".contact-form");
  const statusMessage = document.getElementById("status-message");

  form.removeAttribute("action");

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    statusMessage.textContent = "Sending your message...";
    statusMessage.className = "status-message sending";
    statusMessage.style.display = "block";

    const serviceID = "service_2ejy1an";
    const templateID = "template_s7mhsfq";

    // send with emailjs
    emailjs.sendForm(serviceID, templateID, form).then(
      () => {
        statusMessage.textContent = "Message sent successfully!";
        statusMessage.className = "status-message success";

        // Reset the form after successful submission
        form.reset();
      },
      () => {
        statusMessage.textContent = "Failed to send message. Please try again.";
        statusMessage.className = "status-message error";
      }
    );
  });
});
