/**
 * Field Animations & Micro-Interactions
 * Smooth animations, validation feedback, and delightful UX enhancements
 */

(function() {
  'use strict';

  // Configuration
  const config = {
    animationDuration: 0.3,
    validationDelay: 500,
    fieldClasses: {
      valid: 'field-valid',
      invalid: 'field-invalid',
      focused: 'field-focused',
      filled: 'field-filled',
      loading: 'field-loading'
    }
  };

  // Field state tracking
  const fieldState = new Map();

  // Required fields for validation
  const requiredFields = [
    'firstName', 'lastName', 'dob', 'licenseNumber', 'state', 'address', 'city', 'zip'
  ];

  // Initialize
  function initFieldAnimations() {
    injectCSS();
    setupFieldObservers();
    setupValidation();
    setupTooltips();
    setupFocusEffects();
  }

  // Inject CSS
  function injectCSS() {
    const style = document.createElement('style');
    style.textContent = `
      /* Field container styles */
      .field-container {
        position: relative;
        margin-bottom: 16px;
      }
      
      /* Field wrapper with animation */
      .field-wrapper {
        position: relative;
        transition: all ${config.animationDuration}s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      /* Input styles */
      .field-wrapper input,
      .field-wrapper select,
      .field-wrapper textarea {
        width: 100%;
        transition: all ${config.animationDuration}s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      /* Field label animations */
      .field-label {
        position: absolute;
        left: 14px;
        top: 50%;
        transform: translateY(-50%);
        color: rgba(255, 255, 255, 0.5);
        font-size: 14px;
        font-weight: 500;
        pointer-events: none;
        transition: all ${config.animationDuration}s cubic-bezier(0.4, 0, 0.2, 1);
        background: rgba(15, 23, 42, 0.8);
        padding: 0 8px;
        border-radius: 4px;
        z-index: 1;
      }
      
      .field-wrapper input:focus + .field-label,
      .field-wrapper input:not(:placeholder-shown) + .field-label,
      .field-wrapper select:focus + .field-label,
      .field-wrapper select:not([value=""]) + .field-label,
      .field-wrapper textarea:focus + .field-label,
      .field-wrapper textarea:not(:placeholder-shown) + .field-label {
        top: -10px;
        transform: translateY(0);
        font-size: 12px;
        color: #3b82f6;
      }
      
      /* Floating label for dark mode */
      .dark .field-wrapper input:focus + .field-label,
      .dark .field-wrapper input:not(:placeholder-shown) + .field-label {
        color: #60a5fa;
        background: rgba(15, 23, 42, 0.9);
      }
      
      /* Validation states */
      .field-valid .field-wrapper input,
      .field-valid .field-wrapper select,
      .field-valid .field-wrapper textarea {
        border-color: #10b981 !important;
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1) !important;
      }
      
      .field-valid .field-label {
        color: #10b981 !important;
      }
      
      .field-invalid .field-wrapper input,
      .field-invalid .field-wrapper select,
      .field-invalid .field-wrapper textarea {
        border-color: #ef4444 !important;
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
        animation: shake 0.4s ease;
      }
      
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-3px); }
        75% { transform: translateX(3px); }
      }
      
      .field-invalid .field-label {
        color: #ef4444 !important;
      }
      
      /* Focus effects */
      .field-focused .field-wrapper input,
      .field-focused .field-wrapper select,
      .field-focused .field-wrapper textarea {
        border-color: #3b82f6 !important;
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2) !important;
      }
      
      /* Filled state */
      .field-filled .field-wrapper input,
      .field-filled .field-wrapper select,
      .field-filled .field-wrapper textarea {
        border-color: #4b5563 !important;
      }
      
      /* Success pulse animation */
      @keyframes successPulse {
        0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
        50% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
        100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
      }
      
      .field-valid .field-wrapper input:focus,
      .field-valid .field-wrapper select:focus,
      .field-valid .field-wrapper textarea:focus {
        animation: successPulse 1s ease-out;
      }
      
      /* Character counter for text fields */
      .field-character-counter {
        position: absolute;
        right: 14px;
        bottom: 14px;
        font-size: 11px;
        color: rgba(255, 255, 255, 0.4);
        font-family: monospace;
        transition: color ${config.animationDuration}s ease;
      }
      
      .field-valid ~ .field-character-counter {
        color: #10b981;
      }
      
      .field-invalid ~ .field-character-counter {
        color: #ef4444;
      }
      
      /* Field icon animations */
      .field-icon {
        position: absolute;
        right: 14px;
        top: 50%;
        transform: translateY(-50%);
        width: 20px;
        height: 20px;
        color: rgba(255, 255, 255, 0.4);
        transition: all ${config.animationDuration}s ease;
        pointer-events: none;
      }
      
      .field-wrapper input:focus ~ .field-icon,
      .field-wrapper input:not(:placeholder-shown) ~ .field-icon {
        color: #3b82f6;
        transform: translateY(-50%) scale(1.1);
      }
      
      .field-valid .field-icon {
        color: #10b981;
      }
      
      .field-invalid .field-icon {
        color: #ef4444;
      }
      
      /* Field validation message */
      .field-validation-message {
        position: absolute;
        left: 14px;
        bottom: -22px;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.5);
        transition: all ${config.animationDuration}s ease;
        opacity: 0;
        visibility: hidden;
      }
      
      .field-valid ~ .field-validation-message {
        color: #10b981;
        opacity: 1;
        visibility: visible;
      }
      
      .field-invalid ~ .field-validation-message {
        color: #ef4444;
        opacity: 1;
        visibility: visible;
      }
      
      /* Field group animations */
      .field-group {
        position: relative;
        padding: 16px;
        border-radius: 12px;
        transition: all ${config.animationDuration}s ease;
        overflow: hidden;
      }
      
      .field-group:hover {
        background: rgba(255, 255, 255, 0.02);
      }
      
      /* Progressive disclosure animation */
      .field-progressive {
        max-height: 0;
        overflow: hidden;
        transition: max-height ${config.animationDuration}s ease;
        opacity: 0;
      }
      
      .field-progressive.expanded {
        max-height: 1000px;
        opacity: 1;
      }
      
      /* Field loading state */
      .field-loading::after {
        content: '';
        position: absolute;
        right: 14px;
        top: 50%;
        width: 16px;
        height: 16px;
        margin-top: -8px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: #3b82f6;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
      }
      
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      /* Smooth checkbox and radio buttons */
      .field-checkbox,
      .field-radio {
        position: relative;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        border-radius: 8px;
        cursor: pointer;
        transition: all ${config.animationDuration}s ease;
      }
      
      .field-checkbox:hover,
      .field-radio:hover {
        background: rgba(59, 130, 246, 0.1);
      }
      
      .field-checkbox input,
      .field-radio input {
        opacity: 0;
        position: absolute;
        width: 18px;
        height: 18px;
        cursor: pointer;
      }
      
      .field-checkbox .custom-checkbox,
      .field-radio .custom-radio {
        position: relative;
        width: 20px;
        height: 20px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 4px;
        transition: all ${config.animationDuration}s ease;
        flex-shrink: 0;
      }
      
      .field-radio .custom-radio {
        border-radius: 50%;
      }
      
      .field-checkbox input:checked + .custom-checkbox,
      .field-radio input:checked + .custom-radio {
        border-color: #3b82f6;
        background: #3b82f6;
      }
      
      .field-checkbox .custom-checkbox::after,
      .field-radio .custom-radio::after {
        content: '';
        position: absolute;
        top: 2px;
        left: 6px;
        width: 5px;
        height: 10px;
        border: solid white;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg) scale(0);
        transition: transform ${config.animationDuration}s ease;
      }
      
      .field-checkbox input:checked + .custom-checkbox::after {
        transform: rotate(45deg) scale(1);
      }
      
      .field-radio .custom-radio::after {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        border: none;
        background: white;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0);
      }
      
      .field-radio input:checked + .custom-radio::after {
        transform: translate(-50%, -50%) scale(1);
      }
      
      /* Field reveal animation */
      @keyframes reveal {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .field-reveal {
        animation: reveal 0.4s ease-out forwards;
      }
      
      /* Field highlight effect */
      .field-highlight {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, #3b82f6, #8b5cf6);
        transform: scaleX(0);
        transition: transform ${config.animationDuration}s ease;
      }
      
      .field-wrapper input:focus ~ .field-highlight,
      .field-wrapper select:focus ~ .field-highlight,
      .field-wrapper textarea:focus ~ .field-highlight {
        transform: scaleX(1);
      }
      
      /* Field progress indicator */
      .field-progress {
        position: absolute;
        top: 0;
        left: 0;
        height: 3px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 0 0 0 0;
        overflow: hidden;
      }
      
      .field-progress::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        background: linear-gradient(90deg, #10b981, #3b82f6);
        transition: width ${config.animationDuration}s ease;
        width: 0%;
      }
      
      .field-valid ~ .field-progress::after {
        width: 100%;
      }
    `;
    document.head.appendChild(style);
  }

  // Setup field observers
  function setupFieldObservers() {
    const form = document.getElementById('aamvaForm');
    if (!form) return;

    // Observe all inputs, selects, and textareas
    const fields = form.querySelectorAll('input, select, textarea');

    fields.forEach(field => {
      // Track field state
      fieldState.set(field, {
        isFocused: false,
        isFilled: !!field.value,
        isValid: null,
        hasBeenValidated: false
      });

      // Focus events
      field.addEventListener('focus', () => handleFieldFocus(field));
      field.addEventListener('blur', () => handleFieldBlur(field));

      // Input events
      field.addEventListener('input', () => handleFieldInput(field));
      field.addEventListener('change', () => handleFieldChange(field));

      // Initial state
      updateFieldState(field);
    });
  }

  // Setup validation
  function setupValidation() {
    const form = document.getElementById('aamvaForm');
    if (!form) return;

    // Listen for form validation
    form.addEventListener('validate', (e) => {
      if (e.detail && e.detail.field) {
        updateFieldValidation(e.detail.field, e.detail.valid, e.detail.message);
      }
    });

    // Debounced validation on blur
    const fields = form.querySelectorAll('input, select, textarea');
    fields.forEach(field => {
      field.addEventListener('blur', debounce(() => {
        validateField(field);
      }, config.validationDelay));
    });
  }

  // Handle field focus
  function handleFieldFocus(field) {
    const state = fieldState.get(field);
    if (state) {
      state.isFocused = true;
      updateFieldState(field);
    }

    // Add focused class to container
    const wrapper = field.closest('.field-wrapper, .form-group, .input-group') || field.parentElement;
    wrapper.classList.add(config.fieldClasses.focused);
  }

  // Handle field blur
  function handleFieldBlur(field) {
    const state = fieldState.get(field);
    if (state) {
      state.isFocused = false;
      updateFieldState(field);
    }

    // Remove focused class
    const wrapper = field.closest('.field-wrapper, .form-group, .input-group') || field.parentElement;
    wrapper.classList.remove(config.fieldClasses.focused);

    // Validate on blur
    validateField(field);
  }

  // Handle field input
  function handleFieldInput(field) {
    const state = fieldState.get(field);
    if (state) {
      state.isFilled = !!field.value;
      updateFieldState(field);
    }
  }

  // Handle field change
  function handleFieldChange(field) {
    const state = fieldState.get(field);
    if (state) {
      state.isFilled = !!field.value;
      updateFieldState(field);
    }

    // Trigger form validation
    const form = document.getElementById('aamvaForm');
    if (form) {
      form.dispatchEvent(new CustomEvent('fieldChanged', {
        detail: { field, value: field.value }
      }));
    }
  }

  // Update field state
  function updateFieldState(field) {
    const state = fieldState.get(field);
    if (!state) return;

    const wrapper = field.closest('.field-wrapper, .form-group, .input-group') || field.parentElement;

    // Remove all state classes
    wrapper.classList.remove(
      config.fieldClasses.valid,
      config.fieldClasses.invalid,
      config.fieldClasses.filled
    );

    // Add appropriate classes
    if (state.isValid === true) {
      wrapper.classList.add(config.fieldClasses.valid);
    } else if (state.isValid === false) {
      wrapper.classList.add(config.fieldClasses.invalid);
    }

    if (state.isFilled) {
      wrapper.classList.add(config.fieldClasses.filled);
    }
  }

  // Validate field
  function validateField(field) {
    const state = fieldState.get(field);
    if (!state) return;

    const value = field.value.trim();
    const fieldName = field.name || field.id;

    // Skip validation for non-required fields if empty
    if (!value && !requiredFields.includes(fieldName)) {
      state.isValid = null;
      updateFieldState(field);
      return;
    }

    // Field-specific validation
    let isValid = true;
    let message = '';

    switch (fieldName) {
      case 'licenseNumber':
        isValid = /^[A-Z0-9\-]{6,20}$/i.test(value);
        message = isValid ? 'Valid license number' : 'Invalid license number format';
        break;

      case 'zip':
        isValid = /^\d{5}(-\d{4})?$/.test(value);
        message = isValid ? 'Valid ZIP code' : 'Invalid ZIP code format';
        break;

      case 'dob':
      case 'issueDate':
      case 'expDate':
        isValid = /^\d{2}\/\d{2}\/\d{4}$/.test(value) || /^\d{8}$/.test(value);
        message = isValid ? 'Valid date' : 'Invalid date format (MM/DD/YYYY)';
        break;

      case 'email':
        isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        message = isValid ? 'Valid email' : 'Invalid email format';
        break;

      case 'state':
        isValid = /^[A-Z]{2}$/.test(value);
        message = isValid ? 'Valid state' : 'Invalid state (2 letters)';
        break;

      default:
        // Required fields just need to be non-empty
        if (requiredFields.includes(fieldName)) {
          isValid = !!value;
          message = isValid ? 'Field complete' : 'This field is required';
        }
        break;
    }

    state.isValid = isValid;
    state.hasBeenValidated = true;
    updateFieldState(field);

    // Show validation message
    showValidationMessage(field, message, isValid);

    // Trigger event
    const form = document.getElementById('aamvaForm');
    if (form) {
      form.dispatchEvent(new CustomEvent('fieldValidated', {
        detail: { field, valid: isValid, message }
      }));
    }
  }

  // Update field validation
  function updateFieldValidation(field, valid, message) {
    const state = fieldState.get(field);
    if (state) {
      state.isValid = valid;
      state.hasBeenValidated = true;
      updateFieldState(field);
      showValidationMessage(field, message, valid);
    }
  }

  // Show validation message
  function showValidationMessage(field, message, isValid) {
    // Remove existing messages
    const existingMsg = field.parentElement?.querySelector('.field-validation-message');
    if (existingMsg) {
      existingMsg.remove();
    }

    if (!message) return;

    // Create message element
    const msgEl = document.createElement('div');
    msgEl.className = 'field-validation-message';
    msgEl.textContent = message;

    // Insert after field
    field.parentElement?.appendChild(msgEl);
  }

  // Setup tooltips
  function setupTooltips() {
    const form = document.getElementById('aamvaForm');
    if (!form) return;

    const fields = form.querySelectorAll('[data-tooltip]');

    fields.forEach(field => {
      const tooltipText = field.dataset.tooltip;
      if (!tooltipText) return;

      // Create tooltip element
      const tooltip = document.createElement('div');
      tooltip.className = 'field-tooltip';
      tooltip.textContent = tooltipText;
      tooltip.style.position = 'absolute';
      tooltip.style.visibility = 'hidden';
      tooltip.style.opacity = '0';
      tooltip.style.transition = 'all 0.2s ease';

      // Insert tooltip
      field.parentElement?.appendChild(tooltip);

      // Show on hover
      field.addEventListener('mouseenter', () => {
        tooltip.style.visibility = 'visible';
        tooltip.style.opacity = '1';
      });

      field.addEventListener('mouseleave', () => {
        tooltip.style.visibility = 'hidden';
        tooltip.style.opacity = '0';
      });
    });
  }

  // Setup focus effects
  function setupFocusEffects() {
    const form = document.getElementById('aamvaForm');
    if (!form) return;

    // Add highlight elements
    const fields = form.querySelectorAll('input, select, textarea');

    fields.forEach(field => {
      const highlight = document.createElement('div');
      highlight.className = 'field-highlight';
      field.parentElement?.appendChild(highlight);
    });
  }

  // Debounce function
  function debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // Animate field on success
  function animateFieldSuccess(field) {
    const wrapper = field.closest('.field-wrapper, .form-group, .input-group') || field.parentElement;
    wrapper.classList.add('animate-success');

    setTimeout(() => {
      wrapper.classList.remove('animate-success');
    }, 1000);
  }

  // Public API
  window.FieldAnimations = {
    validateField: validateField,
    updateFieldValidation: updateFieldValidation,
    animateFieldSuccess: animateFieldSuccess,
    setFieldValid: (field, valid, message) => {
      updateFieldValidation(field, valid, message);
    },
    setFieldLoading: (field, loading) => {
      const wrapper = field.closest('.field-wrapper, .form-group, .input-group') || field.parentElement;
      if (loading) {
        wrapper.classList.add(config.fieldClasses.loading);
      } else {
        wrapper.classList.remove(config.fieldClasses.loading);
      }
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFieldAnimations);
  } else {
    initFieldAnimations();
  }
})();
