export function isValidProjectName(name: string) {
    return /^[a-zA-Z0-9][a-zA-Z0-9-_]*$/.test(name.trim());
}

export function slugifyProjectName(name: string) {
    return name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}
