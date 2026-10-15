
document.addEventListener("DOMContentLoaded", function () {
    const filterForm = document.getElementById("messageFilterForm");
    const messageSearch = document.getElementById("messageSearch");
    const messageStatus = document.getElementById("messageStatus");
    const filterPage = document.getElementById("filterPage");

    if (filterForm && messageSearch && messageStatus) {
        let searchTimer = null;

        messageSearch.addEventListener("input", function () {
            clearTimeout(searchTimer);

            searchTimer = setTimeout(function () {
                if (filterPage) {
                    filterPage.value = "1";
                }

                filterForm.requestSubmit();
            }, 250);
        });

        messageStatus.addEventListener("change", function () {
            clearTimeout(searchTimer);

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

        let emptyMessage = templateOptions.querySelector(".template-empty-message");

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

    const recipientFile = document.getElementById("recipientFile");
    const headerImage = document.getElementById("headerImage");

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
        button.addEventListener("click", function () {
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


    document.addEventListener("DOMContentLoaded", function () {
        document.querySelectorAll("[data-file-picker]").forEach(function (row) {
            const inputId = row.dataset.filePicker;
            const fileInput = document.getElementById(inputId);

            if (!fileInput) return;

            row.addEventListener("click", function (event) {
                if (event.target.closest("[data-clear]")) return;
                if (event.target === fileInput) return;

                fileInput.click();
            });

            row.addEventListener("keydown", function (event) {
                if (event.target.closest("[data-clear]")) return;

                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    fileInput.click();
                }
            });
        });

        document.querySelectorAll("[data-clear]").forEach(function (button) {
            button.addEventListener("click", function (event) {
                event.preventDefault();
                event.stopPropagation();

                const inputId = button.dataset.clear;
                const displayId = button.dataset.display;
                const fileInput = document.getElementById(inputId);
                const display = document.getElementById(displayId);

                if (fileInput) {
                    fileInput.value = "";
                }

                if (display) {
                    display.textContent = inputId === "recipientFile"
                        ? "No recipient file selected"
                        : "No header image selected";
                }
            });
        });

        const recipientFile = document.getElementById("recipientFile");
        const recipientName = document.getElementById("recipientName");
        const headerImage = document.getElementById("headerImage");
        const headerImageName = document.getElementById("headerImageName");

        if (recipientFile && recipientName) {
            recipientFile.addEventListener("change", function () {
                recipientName.textContent = this.files.length
                    ? this.files[0].name
                    : "No recipient file selected";
            });
        }

        if (headerImage && headerImageName) {
            headerImage.addEventListener("change", function () {
                headerImageName.textContent = this.files.length
                    ? this.files[0].name
                    : "No header image selected";
            });
        }
    });



});
