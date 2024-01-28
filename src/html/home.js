document.addEventListener("alpine:init", () => {
  Alpine.data("taskStack", function () {
    return {
      tasks: this.$persist([]).as("tasks"),
      title: "",

      removeTask(index) {
        this.tasks.splice(index, 1);
      },
      addTask({ title }) {
        console.log(`title`, title);
        if (title) {
          this.tasks.push({ id: crypto.randomUUID(), title });
          this.title = "";
        }
      },
      moveUp(index) {
        if (index > 0) {
          const [task] = this.tasks.splice(index, 1);
          this.tasks.splice(index - 1, 0, task);
        }
      },
      moveDown(index) {
        if (index < this.tasks.length - 1) {
          const [task] = this.tasks.splice(index, 1);
          this.tasks.splice(index + 1, 0, task);
        }
      },
    };
  });
});
