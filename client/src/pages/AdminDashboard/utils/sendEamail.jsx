import emailjs from "@emailjs/browser";

export const sendVerificationEmail = async ({
  to_email,
  to_name,
  username,
  password,
  link,
}) => {
  try {
    const result = await emailjs.send(
      "service_vxd69mg", // Replace with your actual EmailJS Service ID
      "template_epnlvbr", // Replace with your EmailJS Template ID
      {
        to_name,
        username,
        password,
        link,
        to_email,
      },
      "tEd5iWqPCi7GXWqap"
    );

    console.log("Email sent:", result.text);
    return true;
  } catch (error) {
    console.error("Email send failed:", error.text || error);
    return false;
  }
};
