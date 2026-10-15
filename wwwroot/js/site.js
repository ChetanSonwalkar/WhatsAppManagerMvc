
document.addEventListener("DOMContentLoaded", function () {
    const filterForm = document.getElementById("messageFilterForm");
    const messageSearch = document.getElementById("messageSearch");
    const messageStatus = document.getElementById("messageStatus");
    const filterPage = document.getElementById("filterPage");

    if (filterForm && messageSearch && messageStatus) {
        messageSearch.addEventListener("input", function () {
            if (filterPage) {
                filterPage.value = "1";
            }
        });

        messageStatus.addEventListener("change", function () {
            if (filterPage) {
                filterPage.value = "1";
            }

            filterForm.requestSubmit();
        });
    }

    const bulkForm = document.getElementById("bulkForm");
    const templateSearch = document.getElementById("templateSearch");
    const templateOptions = document.getElementById("templateOptions");
    const templateId = document.getElementById("templateId");
    const templateHint = document.getElementById("templateHint");
    const templateWrap = document.getElementById("templateDropdownWrap");
    const formValidation = document.getElementById("formValidation");

    if (bulkForm && templateSearch && templateOptions && templateId) {
        const templateButtons = Array.from(
            templateOptions.querySelectorAll(".template-option[data-id]")
        );

        let emptyMessage = templateOptions.querySelector(
            ".template-empty-message"
        );

        if (!emptyMessage) {
            emptyMessage = document.createElement("div");
            emptyMessage.className = "template-empty-message";
            emptyMessage.textContent = "No matching templates found.";
            templateOptions.appendChild(emptyMessage);
        }

        function openDropdown() {
            templateOptions.classList.add("open");
            templateSearch.setAttribute("aria-expanded", "true");
        }

        function closeDropdown() {
            templateOptions.classList.remove("open");
            templateSearch.setAttribute("aria-expanded", "false");
        }

        function filterTemplates() {
            const searchText = templateSearch.value.trim().toLowerCase();
            let visibleCount = 0;

            templateButtons.forEach(function (button) {
                const name = button.dataset.name || "";
                const id = button.dataset.id || "";

                const matches =
                    name.toLowerCase().includes(searchText) ||
                    id.toLowerCase().includes(searchText);

                button.hidden = !matches;

                if (matches) {
                    visibleCount++;
                }
            });

            emptyMessage.hidden = visibleCount > 0;
        }

        templateSearch.addEventListener("focus", function () {
            filterTemplates();
            openDropdown();
        });

        templateSearch.addEventListener("click", function () {
            filterTemplates();
            openDropdown();
        });

        templateSearch.addEventListener("input", function () {
            templateId.value = "";

            if (templateHint) {
                templateHint.textContent = "Template ID: Not selected";
            }

            filterTemplates();
            openDropdown();
        });

        templateButtons.forEach(function (button) {
            button.addEventListener("click", function () {
                templateSearch.value = button.dataset.name || "";
                templateId.value = button.dataset.id || "";

                if (templateHint) {
                    templateHint.textContent =
                        "Template ID: " + templateId.value;
                }

                if (formValidation) {
                    formValidation.textContent = "";
                }

                closeDropdown();
            });
        });

        document.addEventListener("click", function (event) {
            if (templateWrap && !templateWrap.contains(event.target)) {
                closeDropdown();
            }
        });

        bulkForm.addEventListener("submit", function (event) {
            if (!templateId.value) {
                event.preventDefault();

                templateSearch.setCustomValidity(
                    "Please select a template from the dropdown."
                );

                templateSearch.reportValidity();
                templateSearch.setCustomValidity("");
                openDropdown();

                if (formValidation) {
                    formValidation.textContent =
                        "Please select a template from the dropdown.";
                }

                return;
            }

            const recipientFile = document.getElementById("recipientFile");

            if (!recipientFile || !recipientFile.files.length) {
                event.preventDefault();

                if (formValidation) {
                    formValidation.textContent =
                        "Please select a recipient file.";
                }

                return;
            }

            if (formValidation) {
                formValidation.textContent = "";
            }
        });
    }

    function updateFileName(input, displayId, defaultText) {
        const display = document.getElementById(displayId);

        if (!input || !display) {
            return;
        }

        display.textContent =
            input.files && input.files.length
                ? input.files[0].name
                : defaultText;
    }

    const recipientFile = document.getElementById("recipientFile");
    const headerImage = document.getElementById("headerImage");

    if (recipientFile) {
        recipientFile.addEventListener("change", function () {
            updateFileName(
                recipientFile,
                "recipientName",
                "No recipient file selected"
            );
        });
    }

    if (headerImage) {
        headerImage.addEventListener("change", function () {
            updateFileName(
                headerImage,
                "headerImageName",
                "No header image selected"
            );
        });
    }

    document.querySelectorAll("[data-clear]").forEach(function (button) {
        button.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();

            const inputId = button.dataset.clear;
            const displayId = button.dataset.display;
            const input = document.getElementById(inputId);

            if (input) {
                input.value = "";
            }

            if (inputId === "recipientFile") {
                updateFileName(
                    input,
                    displayId,
                    "No recipient file selected"
                );
            } else if (inputId === "headerImage") {
                updateFileName(
                    input,
                    displayId,
                    "No header image selected"
                );
            }
        });
    });

    document.querySelectorAll("[data-file-picker]").forEach(function (row) {
        const inputId = row.dataset.filePicker;
        const fileInput = document.getElementById(inputId);

        if (!fileInput) {
            return;
        }

        row.addEventListener("click", function (event) {
            if (event.target.closest("[data-clear]")) {
                return;
            }

            if (event.target !== fileInput) {
                fileInput.click();
            }
        });

        row.addEventListener("keydown", function (event) {
            if (event.target.closest("[data-clear]")) {
                return;
            }

            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                fileInput.click();
            }
        });
    });


    document.addEventListener("DOMContentLoaded", function () {
        const search = document.getElementById("waMessageSearch");
        const chatBody = document.getElementById("waChatBody");
        const refreshButton = document.getElementById("waRefreshButton");
        const visibleCount = document.getElementById("waVisibleCount");
        const noResults = document.getElementById("waNoSearchResults");

        if (!chatBody) return;

        const messageItems = Array.from(
            chatBody.querySelectorAll(".wa-message-item")
        );

        function filterMessages() {
            const term = (search?.value || "").trim().toLowerCase();
            let visible = 0;

            messageItems.forEach(function (item) {
                const text = item.innerText.toLowerCase();
                const match = !term || text.includes(term);

                item.hidden = !match;

                if (match) visible++;
            });

            if (visibleCount) {
                visibleCount.textContent = visible + " messages";
            }

            if (noResults) {
                noResults.hidden = visible !== 0 || messageItems.length === 0;
            }
        }

        if (search) {
            search.addEventListener("input", filterMessages);
        }

        if (refreshButton) {
            refreshButton.addEventListener("click", function () {
                window.location.reload();
            });
        }

        chatBody.scrollTop = chatBody.scrollHeight;
    });

});
