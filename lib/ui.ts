export function startSpinner(text: string) {
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;
  let currentText = text;
  const timer = setInterval(() => {
    const frame = frames[i++ % frames.length];
    Deno.stdout.writeSync(new TextEncoder().encode(`\r  ${frame} ${currentText}`));
  }, 80);

  return {
    update(newText: string) {
      currentText = newText;
    },
    stop(success: boolean) {
      clearInterval(timer);
      const icon = success ? "✅" : "❌";
      Deno.stdout.writeSync(new TextEncoder().encode(`\r  ${icon} ${currentText}\n`));
    },
  };
}
