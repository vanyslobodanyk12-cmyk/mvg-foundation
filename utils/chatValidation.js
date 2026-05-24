const validator = require("validator");

function validateMessage(message) {
  if (!message) {
    return {
      ok: false,
      error: "Message is required"
    };
  }

  const trimmed = message.trim();

  if (trimmed.length === 0) {
    return {
      ok: false,
      error: "Empty message"
    };
  }

  if (trimmed.length > 1000) {
    return {
      ok: false,
      error: "Message too long"
    };
  }

  const escaped = validator.escape(trimmed);

  return {
    ok: true,
    cleanMessage: escaped
  };
}

module.exports = {
  validateMessage
};