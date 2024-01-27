document.addEventListener("alpine:init", () => {
  Alpine.data("taskStack", function () {
    return {
      tasks: this.$persist([]),
      removeTask(index) {
        this.tasks.splice(index, 1);
      },
      addTask({ title }) {
        if (title) {
          this.tasks.push({ id: crypto.randomUUID(), title });
        }
      },
    };
  });
});
