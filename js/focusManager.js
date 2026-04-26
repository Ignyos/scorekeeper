(() => {
  "use strict";

  function createScoreInputFocusManager(options) {
    const config = options || {};
    const container = config.container;
    const inputSelector = typeof config.inputSelector === "string" ? config.inputSelector : "";

    if (!(container instanceof HTMLElement) || !inputSelector) {
      throw new Error("Focus manager requires a container element and input selector.");
    }

    let activeInput = null;
    let allowedFocusInput = null;
    let allowFocusUntil = 0;
    let skipBlurCommitInput = null;
    let skipChangeCommitInput = null;
    let commitChain = Promise.resolve();

    function escapeForCss(value) {
      const text = String(value);
      if (typeof CSS !== "undefined" && CSS && typeof CSS.escape === "function") {
        return CSS.escape(text);
      }
      return text.replace(/([\\"\]])/g, "\\$1");
    }

    function describeInput(input) {
      if (!(input instanceof HTMLInputElement)) {
        return null;
      }

      if (input.id) {
        return { kind: "id", value: input.id };
      }

      const datasetEntries = Object.entries(input.dataset || {}).filter((entry) => {
        const [, value] = entry;
        return typeof value === "string" && value.length > 0;
      });

      if (!datasetEntries.length) {
        return null;
      }

      return {
        kind: "dataset",
        entries: datasetEntries,
      };
    }

    function findInputFromDescriptor(descriptor) {
      if (!descriptor) {
        return null;
      }

      if (descriptor.kind === "id") {
        const byId = document.getElementById(descriptor.value);
        return byId instanceof HTMLInputElement && container.contains(byId) ? byId : null;
      }

      if (descriptor.kind !== "dataset" || !Array.isArray(descriptor.entries) || !descriptor.entries.length) {
        return null;
      }

      const dataSelector = descriptor.entries
        .map(([key, value]) => `[data-${key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}="${escapeForCss(value)}"]`)
        .join("");
      const query = `${inputSelector}${dataSelector}`;
      const candidate = container.querySelector(query);
      return candidate instanceof HTMLInputElement ? candidate : null;
    }

    function resolveManagedInput(target) {
      if (!(target instanceof Element)) {
        return null;
      }
      const input = target.closest(inputSelector);
      if (!(input instanceof HTMLInputElement)) {
        return null;
      }
      if (!container.contains(input)) {
        return null;
      }
      return input;
    }

    function queueCommit(input) {
      const commitHook = window.commitScoreValue;
      if (!(input instanceof HTMLInputElement) || typeof commitHook !== "function") {
        return commitChain;
      }

      commitChain = commitChain
        .then(async () => {
          await commitHook(input, input.value);
        })
        .catch(() => {
          // Keep the queue alive after a failed commit.
        });

      return commitChain;
    }

    function handlePointerDown(event) {
      const tappedInput = resolveManagedInput(event.target);
      if (!(tappedInput instanceof HTMLInputElement)) {
        return;
      }

      allowFocusUntil = Date.now() + 1500;

      if (activeInput && activeInput !== tappedInput) {
        const targetDescriptor = describeInput(tappedInput);
        event.preventDefault();
        skipBlurCommitInput = activeInput;
        skipChangeCommitInput = activeInput;
        void queueCommit(activeInput).finally(() => {
          const targetInput = findInputFromDescriptor(targetDescriptor);
          if (!(targetInput instanceof HTMLInputElement)) {
            return;
          }

          allowFocusUntil = Date.now() + 1500;
          allowedFocusInput = targetInput;
          try {
            targetInput.focus({ preventScroll: true });
          } catch {
            targetInput.focus();
          }
        });
        return;
      }

      allowedFocusInput = tappedInput;
    }

    function handleFocusIn(event) {
      const focusedInput = resolveManagedInput(event.target);
      if (!(focusedInput instanceof HTMLInputElement)) {
        return;
      }

      const focusAllowedByRecentTap = Date.now() <= allowFocusUntil;
      if (allowedFocusInput !== focusedInput && !focusAllowedByRecentTap) {
        focusedInput.blur();
        return;
      }

      allowedFocusInput = null;
      activeInput = focusedInput;
    }

    function handleFocusOut(event) {
      const blurredInput = resolveManagedInput(event.target);
      if (!(blurredInput instanceof HTMLInputElement)) {
        return;
      }

      if (skipBlurCommitInput === blurredInput) {
        skipBlurCommitInput = null;
      }

      if (activeInput === blurredInput) {
        activeInput = null;
      }
    }

    function handleChange(event) {
      const changedInput = resolveManagedInput(event.target);
      if (!(changedInput instanceof HTMLInputElement)) {
        return;
      }

      if (skipChangeCommitInput === changedInput) {
        skipChangeCommitInput = null;
        return;
      }

      void queueCommit(changedInput);
    }

    function handleKeyDown(event) {
      if (event.key !== "Enter") {
        return;
      }

      const input = resolveManagedInput(event.target);
      if (!(input instanceof HTMLInputElement)) {
        return;
      }

      event.preventDefault();
      void queueCommit(input);
    }

    container.addEventListener("pointerdown", handlePointerDown, true);
    container.addEventListener("focusin", handleFocusIn, true);
    container.addEventListener("focusout", handleFocusOut, true);
    container.addEventListener("change", handleChange, true);
    container.addEventListener("keydown", handleKeyDown, true);

    return {
      dispose() {
        container.removeEventListener("pointerdown", handlePointerDown, true);
        container.removeEventListener("focusin", handleFocusIn, true);
        container.removeEventListener("focusout", handleFocusOut, true);
        container.removeEventListener("change", handleChange, true);
        container.removeEventListener("keydown", handleKeyDown, true);
      },
      async commitActiveInput() {
        await queueCommit(activeInput);
      },
    };
  }

  window.ScorekeeperFocusManager = window.ScorekeeperFocusManager || {};
  window.ScorekeeperFocusManager.createScoreInputFocusManager = createScoreInputFocusManager;
})();
