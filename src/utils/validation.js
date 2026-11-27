function isHttpUrl(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidEmail(value) {
  return typeof value === 'string'
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function validateProjectInput(body) {
  const errors = [];
  const input = body && typeof body === 'object' && !Array.isArray(body)
    ? body
    : {};

  for (const field of ['title', 'description', 'owner']) {
    if (typeof input[field] !== 'string' || input[field].trim() === '') {
      errors.push(`${field} is required`);
    }
  }

  if (!Array.isArray(input.technologies)
    || input.technologies.length === 0
    || input.technologies.some((technology) => (
      typeof technology !== 'string' || technology.trim() === ''
    ))) {
    errors.push('technologies must be a non-empty array of strings');
  }

  if (!isHttpUrl(input.githubUrl)) {
    errors.push('githubUrl must be a valid HTTP or HTTPS URL');
  }

  if (input.liveUrl !== undefined && input.liveUrl !== '' && !isHttpUrl(input.liveUrl)) {
    errors.push('liveUrl must be a valid HTTP or HTTPS URL');
  }

  return errors;
}

function validateFeedbackInput(body) {
  const errors = [];
  const input = body && typeof body === 'object' && !Array.isArray(body)
    ? body
    : {};

  if (typeof input.name !== 'string' || input.name.trim() === '') {
    errors.push('name is required');
  }

  if (!isValidEmail(input.email)) {
    errors.push('email must be a valid email address');
  }

  if (input.rating === undefined || input.rating === null || input.rating === '') {
    errors.push('rating is required');
  } else if (!Number.isInteger(Number(input.rating))
    || Number(input.rating) < 1
    || Number(input.rating) > 5) {
    errors.push('rating must be an integer between 1 and 5');
  }

  if (typeof input.comment !== 'string' || input.comment.trim() === '') {
    errors.push('comment is required');
  } else if (input.comment.length > 500) {
    errors.push('comment must not exceed 500 characters');
  }

  return errors;
}

module.exports = {
  isHttpUrl,
  isValidEmail,
  validateProjectInput,
  validateFeedbackInput
};
