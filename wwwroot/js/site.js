
document.addEventListener("DOMContentLoaded", function () {
    const filterForm = document.getElementById("messageFilterForm");
    const messageSearch = document.getElementById("messageSearch");
    const messageStatus = document.getElementById("messageStatus");
    const filterPage = document.getElementById("filterPage");

    if (filterForm && messageSearch && messageStatus) {
        messageSearch.addEventListener("input", function () {
            if (filterPage) filterPage.value = "1";
        });

        messageStatus.addEventListener("change", function () {
            if (filterPage) filterPage.value = "1";
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

                if (matches) visibleCount++;
            });

            emptyMessage.hidden = visibleCount > 0;
        }

        templateSearch.addEventListener("click", function () {
            if (templateOptions.classList.contains("open")) {
                closeDropdown();
            } else {
                filterTemplates();
                openDropdown();
            }
        });

        templateSearch.addEventListener("input", function () {
            templateId.value = "";

            if (templateHint) {
                templateHint.textContent = "Template ID: Not selected";
            }

            templateButtons.forEach(function (button) {
                button.classList.remove("selected");
                button.setAttribute("aria-selected", "false");
            });

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

                templateButtons.forEach(function (item) {
                    const selected = item === button;
                    item.classList.toggle("selected", selected);
                    item.setAttribute("aria-selected", String(selected));
                });

                if (formValidation) {
                    formValidation.textContent = "";
                }

                closeDropdown();
            });
        });

        document.addEventListener("click", function (event) {
            if (
                templateWrap &&
                !templateWrap.contains(event.target)
            ) {
                closeDropdown();
            }
        });

        templateSearch.addEventListener("keydown", function (event) {
            if (event.key === "Escape") {
                closeDropdown();
            }

            if (event.key === "ArrowDown") {
                event.preventDefault();

                if (!templateOptions.classList.contains("open")) {
                    filterTemplates();
                    openDropdown();
                }

                const firstVisible = templateButtons.find(function (button) {
                    return !button.hidden;
                });

                if (firstVisible) firstVisible.focus();
            }
        });

        templateButtons.forEach(function (button) {
            button.addEventListener("keydown", function (event) {
                const visibleButtons = templateButtons.filter(function (item) {
                    return !item.hidden;
                });

                const index = visibleButtons.indexOf(button);

                if (event.key === "Escape") {
                    closeDropdown();
                    templateSearch.focus();
                }

                if (event.key === "ArrowDown" && visibleButtons[index + 1]) {
                    event.preventDefault();
                    visibleButtons[index + 1].focus();
                }

                if (event.key === "ArrowUp") {
                    event.preventDefault();

                    if (visibleButtons[index - 1]) {
                        visibleButtons[index - 1].focus();
                    } else {
                        templateSearch.focus();
                    }
                }
            });
        });

        bulkForm.addEventListener("submit", function (event) {
            if (!templateId.value) {
                event.preventDefault();

                if (formValidation) {
                    formValidation.textContent =
                        "Please select a template from the list.";
                }

                filterTemplates();
                openDropdown();
                templateSearch.focus();
                return;
            }

            const recipientFile =
                document.getElementById("recipientFile");

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

        if (!input || !display) return;

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

            const input = document.getElementById(button.dataset.clear);
            const displayId = button.dataset.display;

            if (!input) return;

            input.value = "";

            if (input.id === "recipientFile") {
                updateFileName(
                    input,
                    displayId,
                    "No recipient file selected"
                );
            } else if (input.id === "headerImage") {
                updateFileName(
                    input,
                    displayId,
                    "No header image selected"
                );
            }
        });
    });

    document.querySelectorAll("[data-file-picker]").forEach(function (row) {
        const input = document.getElementById(row.dataset.filePicker);

        if (!input) return;

        row.addEventListener("click", function (event) {
            if (event.target.closest("[data-clear]")) return;

            input.click();
        });

        row.addEventListener("keydown", function (event) {
            if (event.target.closest("[data-clear]")) return;

            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                input.click();
            }
        });
    });

    const chatBody = document.getElementById("waChatBody");

    if (chatBody) {
        const search = document.getElementById("waMessageSearch");
        const refreshButton = document.getElementById("waRefreshButton");
        const visibleCount = document.getElementById("waVisibleCount");
        const noResults = document.getElementById("waNoSearchResults");

        const messageItems = Array.from(
            chatBody.querySelectorAll(".wa-message-item")
        );

        function filterChatItems() {
            const term = (search?.value || "").trim().toLowerCase();
            let visible = 0;

            messageItems.forEach(function (item) {
                item.hidden = !item.innerText.toLowerCase().includes(term);

                if (!item.hidden) visible++;
            });

            if (visibleCount) {
                visibleCount.textContent = visible + " messages";
            }

            if (noResults) {
                noResults.hidden =
                    visible !== 0 || messageItems.length === 0;
            }
        }

        if (search) {
            search.addEventListener("input", filterChatItems);
        }

        if (refreshButton) {
            refreshButton.addEventListener("click", function () {
                window.location.reload();
            });
        }

        chatBody.scrollTop = chatBody.scrollHeight;
    }

    const waBody = document.getElementById("waBody");

    if (waBody) {
        const search = document.getElementById("waSearch");
        const count = document.getElementById("waCount");
        const noResults = document.getElementById("waNoResults");
        const refresh = document.getElementById("waRefresh");

        const rows = Array.from(
            waBody.querySelectorAll(".wa-message-row")
        );

        function filterMessages() {
            const term = (search?.value || "").trim().toLowerCase();
            let visible = 0;

            rows.forEach(function (row) {
                const text = (
                    row.innerText + " " + (row.dataset.search || "")
                ).toLowerCase();

                row.hidden = !!term && !text.includes(term);

                if (!row.hidden) visible++;
            });

            waBody.querySelectorAll(".wa-date").forEach(function (date) {
                let next = date.nextElementSibling;
                let found = false;

                while (next && !next.classList.contains("wa-date")) {
                    if (
                        next.classList.contains("wa-message-row") &&
                        !next.hidden
                    ) {
                        found = true;
                        break;
                    }

                    next = next.nextElementSibling;
                }

                date.hidden = !found;
            });

            if (count) {
                count.textContent = visible + " messages";
            }

            if (noResults) {
                noResults.hidden = visible > 0;
            }
        }

        if (search) {
            search.addEventListener("input", filterMessages);
        }

        if (refresh) {
            refresh.addEventListener("click", function () {
                window.location.reload();
            });
        }

        const textForm = document.getElementById("waTextForm");
        const textInput = document.getElementById("waTextMessage");
        const sendTextButton = document.getElementById("waSendTextButton");

        if (textInput && sendTextButton) {
            textInput.addEventListener("input", function () {
                sendTextButton.disabled = !textInput.value.trim();
                textInput.style.height = "auto";
                textInput.style.height =
                    Math.min(textInput.scrollHeight, 130) + "px";
            });

            sendTextButton.disabled = !textInput.value.trim();
        }

        if (textForm && textInput) {
            textForm.addEventListener("submit", function (event) {
                event.preventDefault();

                const text = textInput.value.trim();
                const phone = "@waNumber";

                if (!text) {
                    textInput.focus();
                    return;
                }

                if (!phone) {
                    alert("Phone number is missing.");
                    return;
                }

                const url =
                    "https://wa.me/" + phone +
                    "?text=" + encodeURIComponent(text);

                window.open(url, "_blank", "noopener,noreferrer");
            });
        }

        waBody.scrollTop = waBody.scrollHeight;
    }
});
