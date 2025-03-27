document.addEventListener('DOMContentLoaded', function() {
    const newFolder = document.getElementById('createFolder');
    const closeFolder = document.getElementById("closeFolderModal");
    const folderModal = document.getElementById("folderModal");

    newFolder.addEventListener("click", () => {
        folderModal.classList.add("active");
    })
    closeFolder.addEventListener("click", () => {
        folderModal.classList.remove("active");
    })

    const newFile = document.getElementById('uploadFile');
    const closeFile = document.getElementById("closeFileModal");
    const fileModal = document.getElementById("fileModal");

    newFile.addEventListener("click", () => {
        fileModal.classList.add("active");
    })
    closeFile.addEventListener("click", () => {
        fileModal.classList.remove("active");
    })

    const deleteItems = document.querySelectorAll('.deleteItem');
    const closeDelete = document.getElementById("closeDeleteModal");
    const deleteModal = document.getElementById("deleteModal");
    const cancelDelete = document.querySelector('.cancelDelete');

    deleteItems.forEach((btn)=>{
        btn.addEventListener('click',()=>{
            const delUrl = btn.dataset.href;
            deleteModal.classList.add("active");
            const delForm = deleteModal.querySelector('.modalForm');
            delForm.action = delUrl;
        })
    })
    cancelDelete.addEventListener("click", (e) => {
        e.preventDefault();
        deleteModal.classList.remove("active");
        const delForm = deleteModal.querySelector('.modalForm');
        delForm.action = "#";
    })
    closeDelete.addEventListener("click", () => {
        deleteModal.classList.remove("active");
        const delForm = deleteModal.querySelector('.modalForm');
        delForm.action = "#";
    })

    const shareItems = document.querySelectorAll('.shareItem');
    const closeShare = document.getElementById("closeShareModal");
    const shareModal = document.getElementById("shareModal");
    const cancelShare = document.querySelector('.cancelShare');
    // const shareSubmit = document.querySelector('button[data-shareItem]');

    function getShareLink(event,itemId,modal) {
        event.preventDefault();
        let subBtn = event.target;
        subBtn.disabled = true;
        subBtn.innerText = "Processing...";
        const duration = modal.querySelector('input[name="shareDuration"]:checked').value;
        const msgBox = modal.querySelector('.shareableLink');

        const payload = {
            duration: duration,
            itemId: itemId
        };

        fetch("/drive/share", {  
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(resp => {
            if (!resp.ok) {
                throw new Error('Network response was not ok');
            }
            return resp.json();
        }).then(data => { 
            msgBox.style.display = 'flex';
            msgBox.value = data.link;
            subBtn.disabled = false;
            subBtn.innerText = "Generate";
        })
    }

    shareItems.forEach((btn)=>{
        btn.addEventListener('click',()=>{
            const itemId = btn.dataset.itid;
            shareModal.classList.add("active");
            const shareSubmit = shareModal.querySelector('button[data-shareItem]');
            shareSubmit.addEventListener('click',(e)=>{
                getShareLink(e,itemId,shareModal);
            })
        })
    })

    cancelShare.addEventListener("click", (e) => {
        e.preventDefault();
        shareModal.classList.remove("active");
        const msgBox = shareModal.querySelector('.shareableLink');
        msgBox.value = '';
        msgBox.style.display = 'none';
    })

    closeShare.addEventListener("click", () => {
        shareModal.classList.remove("active");
        const msgBox = shareModal.querySelector('.shareableLink');
        msgBox.value = '';
        msgBox.style.display = 'none';
    })

    // Close any modal when clicking outside modal content
    const allModals = document.querySelectorAll('.modal');
    allModals.forEach((modal) => {
        modal.addEventListener("click", (event) => {
            if (event.target === modal) {
                modal.classList.remove("active");
                if (modal.id === deleteModal.id) {
                    const delForm = deleteModal.querySelector('.modalForm');
                    delForm.action = "#";
                }
                if (modal.id === shareModal.id) {
                    const msgBox = shareModal.querySelector('.shareableLink');
                    msgBox.value = '';
                    msgBox.style.display = 'none';
                    const submitButton = modal.querySelector("button[type='submit']");
                    if (submitButton.disabled) {
                        submitButton.disabled = false;
                        submitButton.innerText = 'Generate';
                    };
                }
            }
        })
    });

    // Enforce atomic operations when submitting modal forms
    const modalForms = document.querySelectorAll('.modalForm');
    modalForms.forEach((subForm)=>{
        subForm.addEventListener('submit',()=>{
            const submitButton = subForm.querySelector("button[type='submit']");
            submitButton.disabled = true;
            submitButton.innerText = "Processing...";
        })
    })
});