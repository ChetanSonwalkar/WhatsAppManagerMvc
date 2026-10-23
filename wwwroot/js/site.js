document.addEventListener("DOMContentLoaded", function () {
    const byId = (id) => document.getElementById(id);
    const reloadPage = () => window.location.reload();

    function bindRefresh(button) {
        if (!button || button.dataset.refreshBound === "true") return;
        button.dataset.refreshBound = "true";
        button.addEventListener("click", reloadPage);
    }

    function setText(element, value) {
        if (element) element.textContent = value;
    }

    function initializeMessageFilters() {
        const form = byId("messageFilterForm");
        const search = byId("messageSearch");
        const status = byId("messageStatus");
        const page = byId("filterPage");

        if (form && search) {
            search.addEventListener("input", function () {
                if (page) page.value = "1";
            });
        }

        if (form && status) {
            status.addEventListener("change", function () {
                if (page) page.value = "1";
                form.requestSubmit();
            });
        }
    }

    function initializeBulkForm() {
        const form = byId("bulkForm");
        const search = byId("templateSearch");
        const options = byId("templateOptions");
        const templateId = byId("templateId");
        const hint = byId("templateHint");
        const wrap = byId("templateDropdownWrap");
        const validation = byId("formValidation");

        function showValidation(message) {
            setText(validation, message);
        }

        if (form && search && options && templateId) {
            const buttons = Array.from(
                options.querySelectorAll(".template-option[data-id]")
            );

            let emptyMessage = options.querySelector(".template-empty-message");

            if (!emptyMessage) {
                emptyMessage = document.createElement("div");
                emptyMessage.className = "template-empty-message";
                emptyMessage.textContent = "No matching templates found.";
                options.appendChild(emptyMessage);
            }

            function openDropdown() {
                options.classList.add("open");
                search.setAttribute("aria-expanded", "true");
            }

            function closeDropdown() {
                options.classList.remove("open");
                search.setAttribute("aria-expanded", "false");
            }

            function filterTemplates() {
                const term = search.value.trim().toLowerCase();
                let visibleCount = 0;

                buttons.forEach(function (button) {
                    const name = (button.dataset.name || "").toLowerCase();
                    const id = (button.dataset.id || "").toLowerCase();
                    const matches = name.includes(term) || id.includes(term);

                    button.hidden = !matches;
                    if (matches) visibleCount++;
                });

                emptyMessage.hidden = visibleCount > 0;
            }

            function clearSelection() {
                templateId.value = "";
                setText(hint, "Template ID: Not selected");

                buttons.forEach(function (button) {
                    button.classList.remove("selected");
                    button.setAttribute("aria-selected", "false");
                });
            }

            search.addEventListener("click", function () {
                if (options.classList.contains("open")) {
                    closeDropdown();
                } else {
                    filterTemplates();
                    openDropdown();
                }
            });

            search.addEventListener("input", function () {
                clearSelection();
                showValidation("");
                filterTemplates();
                openDropdown();
            });

            buttons.forEach(function (button) {
                button.setAttribute("aria-selected", "false");

                button.addEventListener("click", function () {
                    search.value = button.dataset.name || "";
                    templateId.value = button.dataset.id || "";
                    setText(hint, "Template ID: " + templateId.value);

                    buttons.forEach(function (item) {
                        const selected = item === button;
                        item.classList.toggle("selected", selected);
                        item.setAttribute("aria-selected", String(selected));
                    });

                    showValidation("");
                    closeDropdown();
                });

                button.addEventListener("keydown", function (event) {
                    const visibleButtons = buttons.filter((item) => !item.hidden);
                    const index = visibleButtons.indexOf(button);

                    if (event.key === "Escape") {
                        closeDropdown();
                        search.focus();
                    } else if (event.key === "ArrowDown" && visibleButtons[index + 1]) {
                        event.preventDefault();
                        visibleButtons[index + 1].focus();
                    } else if (event.key === "ArrowUp") {
                        event.preventDefault();

                        if (visibleButtons[index - 1]) {
                            visibleButtons[index - 1].focus();
                        } else {
                            search.focus();
                        }
                    }
                });
            });

            search.addEventListener("keydown", function (event) {
                if (event.key === "Escape") {
                    closeDropdown();
                } else if (event.key === "ArrowDown") {
                    event.preventDefault();

                    if (!options.classList.contains("open")) {
                        filterTemplates();
                        openDropdown();
                    }

                    const firstVisible = buttons.find((button) => !button.hidden);
                    if (firstVisible) firstVisible.focus();
                }
            });

            document.addEventListener("click", function (event) {
                if (wrap && !wrap.contains(event.target)) closeDropdown();
            });

            form.addEventListener("submit", function (event) {
                if (!templateId.value) {
                    event.preventDefault();
                    showValidation("Please select a template from the list.");
                    filterTemplates();
                    openDropdown();
                    search.focus();
                    return;
                }

                const recipientFile = byId("recipientFile");

                if (!recipientFile || !recipientFile.files.length) {
                    event.preventDefault();
                    showValidation("Please select a recipient file.");
                    return;
                }

                showValidation("");
            });
        }

        function updateFileName(input, displayId, defaultText) {
            const display = byId(displayId);
            if (!input || !display) return;

            display.textContent = input.files && input.files.length
                ? input.files[0].name
                : defaultText;
        }

        const recipientFile = byId("recipientFile");
        const headerImage = byId("headerImage");

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

                const input = byId(button.dataset.clear);
                const displayId = button.dataset.display;
                if (!input) return;

                input.value = "";

                if (input.id === "recipientFile") {
                    updateFileName(input, displayId, "No recipient file selected");
                } else if (input.id === "headerImage") {
                    updateFileName(input, displayId, "No header image selected");
                }
            });
        });

        document.querySelectorAll("[data-file-picker]").forEach(function (row) {
            const input = byId(row.dataset.filePicker);
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
    }

    function initializeSearchList(config) {
        const container = byId(config.containerId);
        if (!container) return;

        const search = byId(config.searchId);
        const count = byId(config.countId);
        const noResults = byId(config.noResultsId);
        const rows = Array.from(container.querySelectorAll(config.rowSelector));

        function filter() {
            const term = (search?.value || "").trim().toLowerCase();
            let visible = 0;

            rows.forEach(function (row) {
                const text = (
                    (row.innerText || "") + " " + (row.dataset.search || "")
                ).toLowerCase();

                const matches = text.includes(term);
                row.hidden = !matches;

                if (matches) visible++;
            });

            if (config.dateSelector) {
                container.querySelectorAll(config.dateSelector).forEach(function (date) {
                    let next = date.nextElementSibling;
                    let found = false;
                    const dateClass = config.dateSelector.slice(1);

                    while (next && !next.classList.contains(dateClass)) {
                        if (next.matches(config.rowSelector) && !next.hidden) {
                            found = true;
                            break;
                        }

                        next = next.nextElementSibling;
                    }

                    date.hidden = !found;
                });
            }

            setText(count, visible + " messages");

            if (noResults) {
                noResults.hidden = visible > 0;
            }
        }

        if (search) {
            search.addEventListener("input", filter);
        }

        bindRefresh(byId(config.refreshId));

        if (config.scrollToBottom) {
            container.scrollTop = container.scrollHeight;
        }
    }

    function initializeChatComposer() {
        const form = byId("waTextForm");
        if (!form) return;

        const messageInput = byId("waTextMessage");
        const messageType = byId("waMessageType");
        const attachmentToggle = byId("waAttachmentToggle");
        const attachmentMenu = byId("waAttachmentMenu");
        const status = byId("waShareStatus");
        const sendButton = byId("waSendTextButton");
        const selectedBox = byId("waSelectedFile");
        const selectedName = byId("waSelectedFileName");
        const removeButton = byId("waRemoveFile");
        const caption = byId("waCaption");
        const numberPanel = byId("waNumberPanel");
        const contactNumber = byId("waContactNumber");
        const addNumberButton = byId("waAddNumber");

        const fileInputs = {
            image: byId("waImageFile"),
            document: byId("waDocumentFile"),
            video: byId("waVideoFile"),
            audio: byId("waAudioFile")
        };

        let activeFileInput = null;

        function showStatus(message, isError = false) {
            if (!status) return;

            status.textContent = message;
            status.style.color = isError ? "#c0392b" : "#087f5b";
        }

        function updateSendButton() {
            if (sendButton) {
                sendButton.disabled =
                    !(messageInput?.value.trim()) &&
                    !activeFileInput?.files?.length;
            }
        }

        function resetAttachment() {
            Object.values(fileInputs).forEach(function (input) {
                if (input) input.value = "";
            });

            activeFileInput = null;

            if (selectedBox) selectedBox.hidden = true;
            setText(selectedName, "");

            if (messageType) messageType.value = "text";

            if (caption) {
                caption.value = "";
                caption.hidden = true;
            }

            updateSendButton();
        }

        function closeAttachmentMenu() {
            if (attachmentMenu) attachmentMenu.hidden = true;
            attachmentToggle?.setAttribute("aria-expanded", "false");
        }

        if (attachmentToggle && attachmentMenu) {
            attachmentToggle.addEventListener("click", function (event) {
                event.stopPropagation();

                const shouldOpen = attachmentMenu.hidden;
                attachmentMenu.hidden = !shouldOpen;

                attachmentToggle.setAttribute(
                    "aria-expanded",
                    String(shouldOpen)
                );
            });

            document.addEventListener("click", function (event) {
                if (
                    !attachmentMenu.contains(event.target) &&
                    !attachmentToggle.contains(event.target)
                ) {
                    closeAttachmentMenu();
                }
            });
        }

        attachmentMenu?.querySelectorAll("[data-share-type]").forEach(function (button) {
            button.addEventListener("click", function () {
                const type = button.dataset.shareType;
                closeAttachmentMenu();

                if (type === "contact") {
                    if (numberPanel) {
                        numberPanel.hidden = !numberPanel.hidden;
                    }

                    contactNumber?.focus();
                    return;
                }

                fileInputs[type]?.click();
            });
        });

        Object.entries(fileInputs).forEach(function ([type, input]) {
            if (!input) return;

            input.addEventListener("change", function () {
                if (!input.files?.length) return;

                activeFileInput = input;

                Object.values(fileInputs).forEach(function (otherInput) {
                    if (otherInput && otherInput !== input) {
                        otherInput.value = "";
                    }
                });

                if (messageType) messageType.value = type;

                setText(selectedName, input.files[0].name);

                if (selectedBox) selectedBox.hidden = false;

                if (caption && (type === "image" || type === "video")) {
                    caption.hidden = false;
                }

                showStatus("Attachment selected.");
                updateSendButton();
            });
        });

        removeButton?.addEventListener("click", function () {
            resetAttachment();
            showStatus("");
        });

        addNumberButton?.addEventListener("click", function () {
            const digits = (contactNumber?.value || "")
                .trim()
                .replace(/\D/g, "");

            if (digits.length < 7 || digits.length > 15) {
                showStatus(
                    "Enter a valid phone number, including country code.",
                    true
                );

                contactNumber?.focus();
                return;
            }

            if (messageInput) {
                const contactText = "Contact number: +" + digits;

                messageInput.value = messageInput.value.trim()
                    ? messageInput.value.trim() + "\n" + contactText
                    : contactText;

                messageInput.dispatchEvent(
                    new Event("input", { bubbles: true })
                );
            }

            if (numberPanel) numberPanel.hidden = true;

            showStatus("Contact number added to your message.");
            updateSendButton();
        });

        messageInput?.addEventListener("input", function () {
            messageInput.style.height = "auto";
            messageInput.style.height =
                Math.min(messageInput.scrollHeight, 130) + "px";

            updateSendButton();
        });

        form.addEventListener("submit", async function (event) {
            event.preventDefault();

            const message = messageInput?.value.trim() || "";
            const file = activeFileInput?.files?.[0] || null;

            if (!message && !file) {
                showStatus("Enter a message or choose a file.", true);
                return;
            }

            if (sendButton) sendButton.disabled = true;

            showStatus("Sending message...");

            try {
                const formData = new FormData(form);

                if (file) {
                    formData.set("file", file, file.name);

                    if (messageType) {
                        formData.set("messageType", messageType.value);
                    }
                } else {
                    formData.delete("file");
                }

                const response = await fetch(form.action, {
                    method: "POST",
                    body: formData,
                    headers: {
                        "X-Requested-With": "XMLHttpRequest"
                    }
                });

                const result = await response.json().catch(() => null);

                if (!response.ok || !result || result.success !== true) {
                    throw new Error(
                        result?.message || "Unable to send the message."
                    );
                }

                if (messageInput) messageInput.value = "";

                resetAttachment();

                showStatus(
                    result.message || "Message request submitted."
                );

                window.setTimeout(reloadPage, 800);
            } catch (error) {
                showStatus(
                    error.message || "Unable to send the message.",
                    true
                );
            } finally {
                if (sendButton) sendButton.disabled = false;
            }
        });

        bindRefresh(byId("waRefresh"));
        updateSendButton();
    }

    function initializeSimpleChatComposer() {
        const form = byId("waForm");
        if (!form) return;

        const plus = byId("waPlus");
        const options = byId("waOptions");
        const file = byId("waFile");
        const text = byId("waText");
        const type = byId("waMessageType");
        const caption = byId("waCaption");
        const send = byId("waSend");
        const fileInfo = byId("waFileInfo");
        const fileName = byId("waFileName");
        const search = byId("waSearch");
        const messages = byId("waMessages");
        const count = byId("waCount");
        const clearFile = byId("waClearFile");

        if (plus && options) {
            plus.addEventListener("click", function (event) {
                event.stopPropagation();
                options.classList.toggle("open");
            });

            options.querySelectorAll("[data-kind]").forEach(function (button) {
                button.addEventListener("click", function () {
                    const kind = button.dataset.kind;

                    if (type) type.value = kind;

                    if (file) {
                        file.accept =
                            kind === "image" ? "image/*" :
                                kind === "video" ? "video/*" :
                                    kind === "audio" ? "audio/*" :
                                        ".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.ppt,.pptx,.zip";
                    }

                    options.classList.remove("open");
                    file?.click();
                });
            });

            document.addEventListener("click", function (event) {
                if (
                    !options.contains(event.target) &&
                    !plus.contains(event.target)
                ) {
                    options.classList.remove("open");
                }
            });
        }

        file?.addEventListener("change", function () {
            const selected = file.files?.[0] || null;

            if (fileInfo) fileInfo.hidden = !selected;

            setText(
                fileName,
                selected ? "Selected: " + selected.name : ""
            );

            if (!selected && type) type.value = "text";
        });

        clearFile?.addEventListener("click", function () {
            if (file) file.value = "";
            if (type) type.value = "text";
            if (caption) caption.value = "";
            if (fileInfo) fileInfo.hidden = true;

            setText(fileName, "");
        });

        form.addEventListener("submit", function (event) {
            const message = text?.value.trim() || "";
            const hasFile = !!file?.files?.length;

            if (!message && !hasFile) {
                event.preventDefault();
                text?.focus();
                return;
            }

            if (hasFile && message && caption) {
                caption.value = message;
            } else if (!hasFile) {
                if (type) type.value = "text";
                if (caption) caption.value = "";
            }

            if (send) {
                send.disabled = true;
                send.textContent = "…";
            }
        });

        text?.addEventListener("keydown", function (event) {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                form.requestSubmit();
            }
        });

        if (search && messages) {
            search.addEventListener("input", function () {
                const term = search.value.trim().toLowerCase();
                const rows = Array.from(
                    messages.querySelectorAll(".wa-row")
                );

                let visible = 0;

                rows.forEach(function (row) {
                    const textValue = (
                        (row.innerText || "") + " " +
                        (row.dataset.search || "")
                    ).toLowerCase();

                    const matches = textValue.includes(term);
                    row.hidden = !matches;

                    if (matches) visible++;
                });

                setText(count, visible + " messages");
            });
        }

        bindRefresh(byId("waRefresh"));

        if (messages) {
            messages.addEventListener("click", function (event) {
                const button = event.target.closest(".wa-read-more");
                if (!button) return;

                const content = byId(button.dataset.target);
                if (!content) return;

                const expanded =
                    button.getAttribute("aria-expanded") === "true";

                content.classList.toggle("collapsed", expanded);

                button.setAttribute(
                    "aria-expanded",
                    String(!expanded)
                );

                button.textContent = expanded
                    ? "Read more"
                    : "Read less";
            });

            messages.scrollTop = messages.scrollHeight;
        }
    }

    function initializeNewChatModal() {
        const modal = byId("newChatModal");
        const openButton = byId("openNewChat");
        const closeButton = byId("closeNewChat");
        const phoneInput = byId("newChatPhone");
        const form = byId("newChatForm");
        const errorBox = byId("newChatError");

        if (
            !modal ||
            !openButton ||
            !closeButton ||
            !phoneInput ||
            !form ||
            !errorBox
        ) {
            return;
        }

        function openModal() {
            modal.classList.add("is-open");
            modal.setAttribute("aria-hidden", "false");
            document.body.classList.add("new-chat-modal-open");
            errorBox.textContent = "";

            window.setTimeout(function () {
                phoneInput.focus();
            }, 50);
        }

        function closeModal() {
            modal.classList.remove("is-open");
            modal.setAttribute("aria-hidden", "true");
            document.body.classList.remove("new-chat-modal-open");
            openButton.focus();
        }

        openButton.addEventListener("click", openModal);
        closeButton.addEventListener("click", closeModal);

        modal.addEventListener("click", function (event) {
            if (event.target === modal) closeModal();
        });

        document.addEventListener("keydown", function (event) {
            if (
                event.key === "Escape" &&
                modal.classList.contains("is-open")
            ) {
                closeModal();
            }
        });

        form.addEventListener("submit", function (event) {
            const raw = phoneInput.value.trim();
            let digits = raw.replace(/\D/g, "");

            if (digits.startsWith("00")) {
                digits = digits.substring(2);
            }

            if (digits.length === 10) {
                digits = "91" + digits;
            }

            if (digits.length === 11 && digits.startsWith("0")) {
                digits = "91" + digits.substring(1);
            }

            if (!/^91[6-9]\d{9}$/.test(digits)) {
                event.preventDefault();

                errorBox.textContent =
                    "Enter a valid 10-digit Indian mobile number or a number with country code 91.";

                return;
            }

            phoneInput.value = digits;
            errorBox.textContent = "";
        });
    }

    initializeMessageFilters();
    initializeBulkForm();

    initializeSearchList({
        containerId: "waChatBody",
        searchId: "waMessageSearch",
        countId: "waVisibleCount",
        noResultsId: "waNoSearchResults",
        refreshId: "waRefreshButton",
        rowSelector: ".wa-message-item",
        scrollToBottom: true
    });

    initializeSearchList({
        containerId: "waBody",
        searchId: "waSearch",
        countId: "waCount",
        noResultsId: "waNoResults",
        refreshId: "waRefresh",
        rowSelector: ".wa-message-row",
        dateSelector: ".wa-date",
        scrollToBottom: true
    });

    initializeChatComposer();
    initializeSimpleChatComposer();
    initializeNewChatModal();

    if (byId("waTextForm")) {
        window.setInterval(function () {
            if (!document.hidden) {
                reloadPage();
            }
        }, 15000);
    }
});








// document.addEventListener("DOMContentLoaded", function () {
//     const filterForm = document.getElementById("messageFilterForm");
//     const messageSearch = document.getElementById("messageSearch");
//     const messageStatus = document.getElementById("messageStatus");
//     const filterPage = document.getElementById("filterPage");

//     if (filterForm && messageSearch && messageStatus) {
//         messageSearch.addEventListener("input", function () {
//             if (filterPage) filterPage.value = "1";
//         });

//         messageStatus.addEventListener("change", function () {
//             if (filterPage) filterPage.value = "1";
//             filterForm.requestSubmit();
//         });
//     }

//     const bulkForm = document.getElementById("bulkForm");
//     const templateSearch = document.getElementById("templateSearch");
//     const templateOptions = document.getElementById("templateOptions");
//     const templateId = document.getElementById("templateId");
//     const templateHint = document.getElementById("templateHint");
//     const templateWrap = document.getElementById("templateDropdownWrap");
//     const formValidation = document.getElementById("formValidation");

//     if (bulkForm && templateSearch && templateOptions && templateId) {
//         const templateButtons = Array.from(
//             templateOptions.querySelectorAll(".template-option[data-id]")
//         );

//         let emptyMessage = templateOptions.querySelector(
//             ".template-empty-message"
//         );

//         if (!emptyMessage) {
//             emptyMessage = document.createElement("div");
//             emptyMessage.className = "template-empty-message";
//             emptyMessage.textContent = "No matching templates found.";
//             templateOptions.appendChild(emptyMessage);
//         }

//         function openDropdown() {
//             templateOptions.classList.add("open");
//             templateSearch.setAttribute("aria-expanded", "true");
//         }

//         function closeDropdown() {
//             templateOptions.classList.remove("open");
//             templateSearch.setAttribute("aria-expanded", "false");
//         }

//         function filterTemplates() {
//             const searchText = templateSearch.value.trim().toLowerCase();
//             let visibleCount = 0;

//             templateButtons.forEach(function (button) {
//                 const name = button.dataset.name || "";
//                 const id = button.dataset.id || "";

//                 const matches =
//                     name.toLowerCase().includes(searchText) ||
//                     id.toLowerCase().includes(searchText);

//                 button.hidden = !matches;

//                 if (matches) visibleCount++;
//             });

//             emptyMessage.hidden = visibleCount > 0;
//         }

//         templateSearch.addEventListener("click", function () {
//             if (templateOptions.classList.contains("open")) {
//                 closeDropdown();
//             } else {
//                 filterTemplates();
//                 openDropdown();
//             }
//         });

//         templateSearch.addEventListener("input", function () {
//             templateId.value = "";

//             if (templateHint) {
//                 templateHint.textContent = "Template ID: Not selected";
//             }

//             templateButtons.forEach(function (button) {
//                 button.classList.remove("selected");
//                 button.setAttribute("aria-selected", "false");
//             });

//             filterTemplates();
//             openDropdown();
//         });

//         templateButtons.forEach(function (button) {
//             button.addEventListener("click", function () {
//                 templateSearch.value = button.dataset.name || "";
//                 templateId.value = button.dataset.id || "";

//                 if (templateHint) {
//                     templateHint.textContent =
//                         "Template ID: " + templateId.value;
//                 }

//                 templateButtons.forEach(function (item) {
//                     const selected = item === button;
//                     item.classList.toggle("selected", selected);
//                     item.setAttribute("aria-selected", String(selected));
//                 });

//                 if (formValidation) {
//                     formValidation.textContent = "";
//                 }

//                 closeDropdown();
//             });
//         });

//         document.addEventListener("click", function (event) {
//             if (
//                 templateWrap &&
//                 !templateWrap.contains(event.target)
//             ) {
//                 closeDropdown();
//             }
//         });

//         templateSearch.addEventListener("keydown", function (event) {
//             if (event.key === "Escape") {
//                 closeDropdown();
//             }

//             if (event.key === "ArrowDown") {
//                 event.preventDefault();

//                 if (!templateOptions.classList.contains("open")) {
//                     filterTemplates();
//                     openDropdown();
//                 }

//                 const firstVisible = templateButtons.find(function (button) {
//                     return !button.hidden;
//                 });

//                 if (firstVisible) firstVisible.focus();
//             }
//         });

//         templateButtons.forEach(function (button) {
//             button.addEventListener("keydown", function (event) {
//                 const visibleButtons = templateButtons.filter(function (item) {
//                     return !item.hidden;
//                 });

//                 const index = visibleButtons.indexOf(button);

//                 if (event.key === "Escape") {
//                     closeDropdown();
//                     templateSearch.focus();
//                 }

//                 if (event.key === "ArrowDown" && visibleButtons[index + 1]) {
//                     event.preventDefault();
//                     visibleButtons[index + 1].focus();
//                 }

//                 if (event.key === "ArrowUp") {
//                     event.preventDefault();

//                     if (visibleButtons[index - 1]) {
//                         visibleButtons[index - 1].focus();
//                     } else {
//                         templateSearch.focus();
//                     }
//                 }
//             });
//         });

//         bulkForm.addEventListener("submit", function (event) {
//             if (!templateId.value) {
//                 event.preventDefault();

//                 if (formValidation) {
//                     formValidation.textContent =
//                         "Please select a template from the list.";
//                 }

//                 filterTemplates();
//                 openDropdown();
//                 templateSearch.focus();
//                 return;
//             }

//             const recipientFile =
//                 document.getElementById("recipientFile");

//             if (!recipientFile || !recipientFile.files.length) {
//                 event.preventDefault();

//                 if (formValidation) {
//                     formValidation.textContent =
//                         "Please select a recipient file.";
//                 }

//                 return;
//             }

//             if (formValidation) {
//                 formValidation.textContent = "";
//             }
//         });
//     }

//     function updateFileName(input, displayId, defaultText) {
//         const display = document.getElementById(displayId);

//         if (!input || !display) return;

//         display.textContent =
//             input.files && input.files.length
//                 ? input.files[0].name
//                 : defaultText;
//     }

//     const recipientFile = document.getElementById("recipientFile");
//     const headerImage = document.getElementById("headerImage");

//     if (recipientFile) {
//         recipientFile.addEventListener("change", function () {
//             updateFileName(
//                 recipientFile,
//                 "recipientName",
//                 "No recipient file selected"
//             );
//         });
//     }

//     if (headerImage) {
//         headerImage.addEventListener("change", function () {
//             updateFileName(
//                 headerImage,
//                 "headerImageName",
//                 "No header image selected"
//             );
//         });
//     }

//     document.querySelectorAll("[data-clear]").forEach(function (button) {
//         button.addEventListener("click", function (event) {
//             event.preventDefault();
//             event.stopPropagation();

//             const input = document.getElementById(button.dataset.clear);
//             const displayId = button.dataset.display;

//             if (!input) return;

//             input.value = "";

//             if (input.id === "recipientFile") {
//                 updateFileName(
//                     input,
//                     displayId,
//                     "No recipient file selected"
//                 );
//             } else if (input.id === "headerImage") {
//                 updateFileName(
//                     input,
//                     displayId,
//                     "No header image selected"
//                 );
//             }
//         });
//     });

//     document.querySelectorAll("[data-file-picker]").forEach(function (row) {
//         const input = document.getElementById(row.dataset.filePicker);

//         if (!input) return;

//         row.addEventListener("click", function (event) {
//             if (event.target.closest("[data-clear]")) return;

//             input.click();
//         });

//         row.addEventListener("keydown", function (event) {
//             if (event.target.closest("[data-clear]")) return;

//             if (event.key === "Enter" || event.key === " ") {
//                 event.preventDefault();
//                 input.click();
//             }
//         });
//     });

//     const chatBody = document.getElementById("waChatBody");

//     if (chatBody) {
//         const search = document.getElementById("waMessageSearch");
//         const refreshButton = document.getElementById("waRefreshButton");
//         const visibleCount = document.getElementById("waVisibleCount");
//         const noResults = document.getElementById("waNoSearchResults");

//         const messageItems = Array.from(
//             chatBody.querySelectorAll(".wa-message-item")
//         );

//         function filterChatItems() {
//             const term = (search?.value || "").trim().toLowerCase();
//             let visible = 0;

//             messageItems.forEach(function (item) {
//                 item.hidden = !item.innerText.toLowerCase().includes(term);

//                 if (!item.hidden) visible++;
//             });

//             if (visibleCount) {
//                 visibleCount.textContent = visible + " messages";
//             }

//             if (noResults) {
//                 noResults.hidden =
//                     visible !== 0 || messageItems.length === 0;
//             }
//         }

//         if (search) {
//             search.addEventListener("input", filterChatItems);
//         }

//         if (refreshButton) {
//             refreshButton.addEventListener("click", function () {
//                 window.location.reload();
//             });
//         }

//         chatBody.scrollTop = chatBody.scrollHeight;
//     }

//     const waBody = document.getElementById("waBody");

//     if (waBody) {
//         const search = document.getElementById("waSearch");
//         const count = document.getElementById("waCount");
//         const noResults = document.getElementById("waNoResults");
//         const refresh = document.getElementById("waRefresh");

//         const rows = Array.from(
//             waBody.querySelectorAll(".wa-message-row")
//         );

//         function filterMessages() {
//             const term = (search?.value || "").trim().toLowerCase();
//             let visible = 0;

//             rows.forEach(function (row) {
//                 const text = (
//                     row.innerText + " " + (row.dataset.search || "")
//                 ).toLowerCase();

//                 row.hidden = !!term && !text.includes(term);

//                 if (!row.hidden) visible++;
//             });

//             waBody.querySelectorAll(".wa-date").forEach(function (date) {
//                 let next = date.nextElementSibling;
//                 let found = false;

//                 while (next && !next.classList.contains("wa-date")) {
//                     if (
//                         next.classList.contains("wa-message-row") &&
//                         !next.hidden
//                     ) {
//                         found = true;
//                         break;
//                     }

//                     next = next.nextElementSibling;
//                 }

//                 date.hidden = !found;
//             });

//             if (count) {
//                 count.textContent = visible + " messages";
//             }

//             if (noResults) {
//                 noResults.hidden = visible > 0;
//             }
//         }

//         if (search) {
//             search.addEventListener("input", filterMessages);
//         }

//         if (refresh) {
//             refresh.addEventListener("click", function () {
//                 window.location.reload();
//             });
//         }


//         const textForm = document.getElementById("waTextForm");
//         const textInput = document.getElementById("waTextMessage");
//         const sendButton = document.getElementById("waSendTextButton");
//         const toggleButton = document.getElementById("waAttachmentToggle");
//         const attachmentMenu = document.getElementById("waAttachmentMenu");

//         const imageFile = document.getElementById("waImageFile");
//         const documentFile = document.getElementById("waDocumentFile");
//         const videoFile = document.getElementById("waVideoFile");
//         const audioFile = document.getElementById("waAudioFile");

//         const selectedBox = document.getElementById("waSelectedFile");
//         const selectedName = document.getElementById("waSelectedFileName");
//         const removeFileButton = document.getElementById("waRemoveFile");
//         const numberPanel = document.getElementById("waNumberPanel");
//         const contactNumber = document.getElementById("waContactNumber");
//         const addNumberButton = document.getElementById("waAddNumber");
//         const statusElement = document.getElementById("waShareStatus");

//         let selectedFile = null;

//         const phone = document.querySelector(".wa-contact h2")
//             ?.textContent.trim().replace(/\D/g, "") || "";

//         function showStatus(message) {
//             if (statusElement) statusElement.textContent = message;
//         }

//         function updateSendButton() {
//             if (sendButton) {
//                 sendButton.disabled =
//                     !textInput?.value.trim() && !selectedFile;
//             }
//         }

//         function closeAttachmentMenu() {
//             if (attachmentMenu) attachmentMenu.hidden = true;
//             toggleButton?.setAttribute("aria-expanded", "false");
//         }

//         toggleButton?.addEventListener("click", function (event) {
//             event.stopPropagation();

//             const shouldOpen = attachmentMenu.hidden;
//             attachmentMenu.hidden = !shouldOpen;
//             toggleButton.setAttribute("aria-expanded", String(shouldOpen));
//         });

//         document.addEventListener("click", function (event) {
//             if (
//                 attachmentMenu &&
//                 !attachmentMenu.contains(event.target) &&
//                 !toggleButton?.contains(event.target)
//             ) {
//                 closeAttachmentMenu();
//             }
//         });

//         attachmentMenu?.querySelectorAll("[data-share-type]").forEach(function (button) {
//             button.addEventListener("click", function () {
//                 const type = button.dataset.shareType;
//                 closeAttachmentMenu();

//                 if (type === "contact") {
//                     if (numberPanel) numberPanel.hidden = !numberPanel.hidden;
//                     contactNumber?.focus();
//                     return;
//                 }

//                 const inputs = {
//                     image: imageFile,
//                     document: documentFile,
//                     video: videoFile,
//                     audio: audioFile
//                 };

//                 inputs[type]?.click();
//             });
//         });

//         function onFileSelected(input) {
//             if (!input?.files?.length) return;

//             selectedFile = input.files[0];

//             [imageFile, documentFile, videoFile, audioFile].forEach(function (item) {
//                 if (item && item !== input) item.value = "";
//             });

//             if (selectedName) selectedName.textContent = selectedFile.name;
//             if (selectedBox) selectedBox.hidden = false;

//             showStatus("Attachment selected.");
//             updateSendButton();
//         }

//         [imageFile, documentFile, videoFile, audioFile].forEach(function (input) {
//             input?.addEventListener("change", function () {
//                 onFileSelected(input);
//             });
//         });

//         removeFileButton?.addEventListener("click", function () {
//             selectedFile = null;

//             [imageFile, documentFile, videoFile, audioFile].forEach(function (input) {
//                 if (input) input.value = "";
//             });

//             if (selectedBox) selectedBox.hidden = true;
//             if (selectedName) selectedName.textContent = "";

//             showStatus("");
//             updateSendButton();
//         });

//         addNumberButton?.addEventListener("click", function () {
//             const rawNumber = (contactNumber?.value || "").trim();
//             const digits = rawNumber.replace(/\D/g, "");

//             if (digits.length < 7 || digits.length > 15) {
//                 showStatus("Enter a valid phone number, including country code.");
//                 contactNumber?.focus();
//                 return;
//             }

//             if (textInput) {
//                 const contactText = "Contact number: +" + digits;
//                 textInput.value = textInput.value.trim()
//                     ? textInput.value.trim() + "\n" + contactText
//                     : contactText;

//                 textInput.dispatchEvent(new Event("input", { bubbles: true }));
//             }

//             if (numberPanel) numberPanel.hidden = true;
//             showStatus("Contact number added to your message.");
//             updateSendButton();
//         });

//         textInput?.addEventListener("input", function () {
//             textInput.style.height = "auto";
//             textInput.style.height =
//                 Math.min(textInput.scrollHeight, 130) + "px";

//             updateSendButton();
//         });

//         updateSendButton();

//         textForm?.addEventListener("submit", async function (event) {
//             event.preventDefault();

//             const message = textInput?.value.trim() || "";

//             if (!phone) {
//                 showStatus("Recipient phone number is missing.");
//                 return;
//             }

//             if (!message && !selectedFile) {
//                 showStatus("Type a message or select an attachment.");
//                 return;
//             }

//             if (selectedFile && navigator.share && navigator.canShare) {
//                 try {
//                     const shareData = {
//                         title: "WhatsApp message",
//                         text: message,
//                         files: [selectedFile]
//                     };

//                     if (navigator.canShare({ files: [selectedFile] })) {
//                         await navigator.share(shareData);
//                         showStatus("Share dialog opened or completed.");
//                         return;
//                     }
//                 } catch (error) {
//                     if (error.name === "AbortError") {
//                         showStatus("Sharing cancelled.");
//                         return;
//                     }
//                 }
//             }

//             const whatsappUrl = "https://wa.me/" + phone +
//                 (message ? "?text=" + encodeURIComponent(message) : "");

//             if (selectedFile) {
//                 showStatus(
//                     "This browser cannot share the file directly. " +
//                     "WhatsApp will open; attach the file there manually."
//                 );
//             }

//             window.open(whatsappUrl, "_blank", "noopener,noreferrer");
//         });

//         waBody.scrollTop = waBody.scrollHeight;
//     }

//     document.addEventListener("DOMContentLoaded", function () {
//         // const form = document.getElementById("waTextForm");
//         const form = document.getElementById("waTextForm");

//         if (!form) return;

//         const messageInput = document.getElementById("waTextMessage");
//         const messageTypeInput = document.getElementById("waMessageType");
//         const attachmentToggle = document.getElementById("waAttachmentToggle");
//         const attachmentMenu = document.getElementById("waAttachmentMenu");
//         const statusElement = document.getElementById("waShareStatus");
//         const sendButton = document.getElementById("waSendTextButton");
//         const selectedFile = document.getElementById("waSelectedFile");
//         const selectedFileName = document.getElementById("waSelectedFileName");
//         const removeFileButton = document.getElementById("waRemoveFile");

//         const fileInputs = {
//             image: document.getElementById("waImageFile"),
//             document: document.getElementById("waDocumentFile"),
//             video: document.getElementById("waVideoFile"),
//             audio: document.getElementById("waAudioFile")
//         };

//         let activeFileInput = null;

//         function showStatus(message, isError) {
//             if (!statusElement) return;

//             statusElement.textContent = message;
//             statusElement.style.color = isError ? "#c0392b" : "#087f5b";
//         }

//         function resetAttachment() {
//             Object.values(fileInputs).forEach(function (input) {
//                 if (input) input.value = "";
//             });

//             activeFileInput = null;

//             if (selectedFile) selectedFile.hidden = true;
//             if (selectedFileName) selectedFileName.textContent = "";
//             if (messageTypeInput) messageTypeInput.value = "text";
//         }

//         if (attachmentToggle && attachmentMenu) {
//             attachmentToggle.addEventListener("click", function () {
//                 attachmentMenu.hidden = !attachmentMenu.hidden;
//             });
//         }

//         document.querySelectorAll("[data-share-type]").forEach(function (button) {
//             button.addEventListener("click", function () {
//                 const type = button.dataset.shareType;
//                 const input = fileInputs[type];

//                 if (!input) return;

//                 if (attachmentMenu) attachmentMenu.hidden = true;
//                 input.click();
//             });
//         });

//         Object.entries(fileInputs).forEach(function ([type, input]) {
//             if (!input) return;

//             input.addEventListener("change", function () {
//                 if (!input.files || !input.files.length) return;

//                 activeFileInput = input;
//                 messageTypeInput.value = type;

//                 if (selectedFile) selectedFile.hidden = false;
//                 if (selectedFileName) {
//                     selectedFileName.textContent = input.files[0].name;
//                 }

//                 if (type === "image" || type === "video") {
//                     document.getElementById("waCaption").hidden = false;
//                 }
//             });
//         });

//         if (removeFileButton) {
//             removeFileButton.addEventListener("click", resetAttachment);
//         }

//         form.addEventListener("submit", async function (event) {
//             event.preventDefault();

//             const text = messageInput.value.trim();
//             const file = activeFileInput &&
//                 activeFileInput.files &&
//                 activeFileInput.files.length
//                 ? activeFileInput.files[0]
//                 : null;

//             if (!text && !file) {
//                 showStatus("Enter a message or choose a file.", true);
//                 return;
//             }

//             const formData = new FormData(form);

//             if (file && activeFileInput) {
//                 formData.set("file", file, file.name);
//             } else {
//                 formData.delete("file");
//             }

//             sendButton.disabled = true;
//             showStatus("Sending message...", false);

//             try {
//                 const response = await fetch(form.action, {
//                     method: "POST",
//                     body: formData,
//                     headers: {
//                         "X-Requested-With": "XMLHttpRequest"
//                     }
//                 });

//                 const result = await response.json().catch(function () {
//                     return null;
//                 });

//                 if (!response.ok || !result || result.success !== true) {
//                     throw new Error(
//                         result && result.message
//                             ? result.message
//                             : "Unable to send the message."
//                     );
//                 }

//                 messageInput.value = "";
//                 document.getElementById("waCaption").value = "";
//                 document.getElementById("waCaption").hidden = true;
//                 resetAttachment();

//                 showStatus("Message request submitted.", false);

//                 window.setTimeout(function () {
//                     window.location.reload();
//                 }, 800);
//             } catch (error) {
//                 showStatus(
//                     error.message || "Unable to send the message.",
//                     true
//                 );
//             } finally {
//                 sendButton.disabled = false;
//             }
//         });

//         const refreshButton = document.getElementById("waRefresh");

//         if (refreshButton) {
//             refreshButton.addEventListener("click", function () {
//                 window.location.reload();
//             });
//         }

//         window.setInterval(function () {
//             if (!document.hidden) {
//                 window.location.reload();
//             }
//         }, 15000);
//     });

//     (() => {
//         const form = document.getElementById("waForm");
//         const plus = document.getElementById("waPlus");
//         const options = document.getElementById("waOptions");
//         const file = document.getElementById("waFile");
//         const text = document.getElementById("waText");
//         const type = document.getElementById("waMessageType");
//         const caption = document.getElementById("waCaption");
//         const send = document.getElementById("waSend");
//         const fileInfo = document.getElementById("waFileInfo");
//         const fileName = document.getElementById("waFileName");
//         const search = document.getElementById("waSearch");
//         const messages = document.getElementById("waMessages");
//         const count = document.getElementById("waCount");

//         plus.addEventListener("click", event => {
//             event.stopPropagation();
//             options.classList.toggle("open");
//         });

//         options.querySelectorAll("[data-kind]").forEach(button => {
//             button.addEventListener("click", () => {
//                 const kind = button.dataset.kind;

//                 type.value = kind;

//                 file.accept = kind === "image" ? "image/*"
//                     : kind === "video" ? "video/*"
//                         : kind === "audio" ? "audio/*"
//                             : ".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.ppt,.pptx,.zip";

//                 options.classList.remove("open");
//                 file.click();
//             });
//         });

//         document.addEventListener("click", event => {
//             if (!options.contains(event.target) &&
//                 !plus.contains(event.target)) {
//                 options.classList.remove("open");
//             }
//         });

//         file.addEventListener("change", () => {
//             const selected = file.files && file.files[0];

//             fileInfo.hidden = !selected;
//             fileName.textContent = selected
//                 ? "Selected: " + selected.name
//                 : "";

//             if (!selected) {
//                 type.value = "text";
//             }
//         });

//         document.getElementById("waClearFile").addEventListener("click", () => {
//             file.value = "";
//             type.value = "text";
//             caption.value = "";
//             fileInfo.hidden = true;
//             fileName.textContent = "";
//         });

//         form.addEventListener("submit", event => {
//             const message = text.value.trim();
//             const hasFile = file.files && file.files.length > 0;

//             if (!message && !hasFile) {
//                 event.preventDefault();
//                 text.focus();
//                 return;
//             }

//             if (hasFile && message) {
//                 caption.value = message;
//             } else if (!hasFile) {
//                 type.value = "text";
//                 caption.value = "";
//             }

//             send.disabled = true;
//             send.textContent = "…";
//         });

//         text.addEventListener("keydown", event => {
//             if (event.key === "Enter" && !event.shiftKey) {
//                 event.preventDefault();
//                 form.requestSubmit();
//             }
//         });

//         search.addEventListener("input", () => {
//             const query = search.value.trim().toLowerCase();
//             const rows = [...messages.querySelectorAll(".wa-row")];
//             let visible = 0;

//             rows.forEach(row => {
//                 const match = (
//                     row.innerText + " " + (row.dataset.search || "")
//                 ).toLowerCase().includes(query);

//                 row.style.display = match ? "flex" : "none";

//                 if (match) {
//                     visible++;
//                 }
//             });

//             count.textContent = visible + " messages";
//         });

//         document.getElementById("waRefresh").addEventListener("click", () => {
//             window.location.reload();
//         });

//         messages.addEventListener("click", event => {
//             const button = event.target.closest(".wa-read-more");
//             if (!button) return;

//             const targetId = button.dataset.target;
//             const content = document.getElementById(targetId);
//             if (!content) return;

//             const expanded = button.getAttribute("aria-expanded") === "true";
//             content.classList.toggle("collapsed", expanded);
//             button.setAttribute("aria-expanded", String(!expanded));
//             button.textContent = expanded ? "Read more" : "Read less";
//         });

//         messages.scrollTop = messages.scrollHeight;
//     })();


//     (() => {
//         const modal = document.getElementById('newChatModal');
//         const openButton = document.getElementById('openNewChat');
//         const closeButton = document.getElementById('closeNewChat');
//         const phoneInput = document.getElementById('newChatPhone');
//         const form = document.getElementById('newChatForm');
//         const errorBox = document.getElementById('newChatError');

//         function openModal() {
//             modal.classList.add('is-open');
//             modal.setAttribute('aria-hidden', 'false');
//             document.body.classList.add('new-chat-modal-open');
//             errorBox.textContent = '';
//             window.setTimeout(() => phoneInput.focus(), 50);
//         }

//         function closeModal() {
//             modal.classList.remove('is-open');
//             modal.setAttribute('aria-hidden', 'true');
//             document.body.classList.remove('new-chat-modal-open');
//             openButton.focus();
//         }

//         openButton.addEventListener('click', openModal);
//         closeButton.addEventListener('click', closeModal);
//         modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
//         document.addEventListener('keydown', event => { if (event.key === 'Escape' && modal.classList.contains('is-open')) closeModal(); });

//         form.addEventListener('submit', event => {
//             const raw = phoneInput.value.trim();
//             let digits = raw.replace(/\D/g, '');
//             if (digits.startsWith('00')) digits = digits.substring(2);
//             if (digits.length === 10) digits = '91' + digits;
//             if (digits.length === 11 && digits.startsWith('0')) digits = '91' + digits.substring(1);

//             if (!/^91[6-9]\d{9}$/.test(digits)) {
//                 event.preventDefault();
//                 errorBox.textContent = 'Enter a valid 10-digit Indian mobile number or a number with country code 91.';
//                 return;
//             }

//             phoneInput.value = digits;
//         });
//     })();

// });
