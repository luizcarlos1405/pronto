import dayjs from "dayjs";

window.dayjs = dayjs;

document.addEventListener("alpine:init", () => {
  Alpine.data("taskStack", function () {
    return {
      tasks: this.$persist([]).as("tasks"),
      title: "",

      removeTask(index) {
        this.tasks.splice(index, 1);
      },
      addTask({ title }) {
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

  Alpine.data("nextTask", function () {
    return {
      tasks: this.$persist([]).as("tasks"),
      get todayTasks() {
        return this.tasks.filter((task) => {
          if (task.constraints?.afterDate) {
            return dayjs(task.constraints.afterDate).isBefore(dayjs(), "day");
          }

          return true;
        });
      },

      get currentTask() {
        return this.todayTasks[0];
      },

      get isAllDone() {
        return this.todayTasks.length === 0;
      },

      doTomorrow() {
        this.tasks[0].constraints ||= {};
        this.tasks[0].constraints.afterDate = dayjs()
          .add(1, "day")
          .startOf("day")
          .toISOString();

        console.log(`this.tasks`, this.tasks);
      },
      doNext() {
        const currentTask = this.tasks[0];
        const nextTask = this.tasks[1];

        this.tasks[0] = nextTask;
        this.tasks[1] = currentTask;
      },
      doLast() {
        const currentTask = this.tasks.shift();
        this.tasks.push(currentTask);
      },
    };
  });
});
