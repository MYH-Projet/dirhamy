function createSuccessToast(message) {

    const toast = document.createElement('div');

    toast.classList.add('toast-box success-toast-box');

    toast.textContent = message;

    return toast;
}

function createErrorToast(message) {
    const toast = document.createElement('div');

    toast.classList.add('toast-box error-toast-box');

    toast.textContent = message;

    return toast;
}

