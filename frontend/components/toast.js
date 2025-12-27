function createSuccessToast(message) {

    const toast = document.createElement('div');

    toast.classList.add('toast-box', 'toast-box-success');

    toast.textContent = message;

    const closeBtn = document.createElement('button');
    closeBtn.classList.add('close-btn');

    closeBtn.innerHTML = '&times;'

    toast.appendChild(closeBtn);

    return toast;
}

function createErrorToast(message) {
    const toast = document.createElement('div');
    
    toast.classList.add('toast-box', 'toast-box-error');

    toast.textContent = message;

    const closeBtn = document.createElement('button');
    closeBtn.classList.add('close-btn');

    closeBtn.innerHTML = '&times;'


    toast.appendChild(closeBtn);



    return toast;
}

export function displayToast(container, message, type) {
    let toastBox;

    if (type === 'success') {
        toastBox = createSuccessToast(message);
    } else if (type === 'error') {
        toastBox = createErrorToast(message);
    }

    container.appendChild(toastBox);

    setTimeout(() => {
        toastBox.remove();
    }, 3000)
    toastBox.querySelector('.close-btn').addEventListener('click', e => {
        toastBox.remove();
    });
}

