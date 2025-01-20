export const classes = (...classes: (string | null)[]) =>
  classes.filter(Boolean).join(" ");
