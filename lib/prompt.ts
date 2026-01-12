import { bold, cyan } from "@std/fmt/colors";

type InputOptions = {
    required?: boolean;
    validate?: (value: string) => string | null;
};

export async function promptInput(
    label: string,
    defaultValue = "",
    opts: InputOptions = {},
): Promise<string> {
    while (true) {
        const v = prompt(`${bold(label)}${defaultValue ? ` (${defaultValue})` : ""}:`) ??
            "";
        const value = v.trim() === "" ? defaultValue : v;

        if (opts.required && !value.trim()) {
            console.log("This value is required.");
            continue;
        }

        if (opts.validate) {
            const err = opts.validate(value);
            if (err) {
                console.log(err);
                continue;
            }
        }

        return value;
    }
}

export async function promptSelect<T>(
    label: string,
    choices: { label: string; value: T }[],
): Promise<T> {
    console.log(bold(label));
    console.log(cyan("Use ↑ ↓ and Enter\n"));

    Deno.stdin.setRaw(true, { cbreak: true });
    let index = 0;

    const render = () => {
        // clear last render
        const lines = choices.length;
        Deno.stdout.writeSync(new TextEncoder().encode(`\x1b[${lines}A`));
        Deno.stdout.writeSync(new TextEncoder().encode(`\x1b[J`));

        choices.forEach((c, i) => {
            const isActive = i === index;
            console.log(isActive ? `> ${c.label}` : `  ${c.label}`);
        });
    };

    // initial list render
    choices.forEach((c, i) => console.log(i === index ? `> ${c.label}` : `  ${c.label}`));

    const buf = new Uint8Array(8);

    while (true) {
        const n = await Deno.stdin.read(buf);
        if (!n) continue;

        const key = [...buf.slice(0, n)];

        // Enter
        if (key[0] === 13) break;

        // Arrow keys: ESC [ A/B
        if (key[0] === 27 && key[1] === 91) {
            if (key[2] === 65) index = Math.max(0, index - 1); // up
            if (key[2] === 66) index = Math.min(choices.length - 1, index + 1); // down
            render();
        }
    }

    Deno.stdin.setRaw(false);
    console.log("");
    return choices[index].value;
}
