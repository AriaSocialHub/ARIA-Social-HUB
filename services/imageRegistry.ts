// services/imageRegistry.ts

/**
 * This registry centralizes the paths to predefined images for news articles.
 * By managing them here, we ensure consistency and make future updates easier.
 * The paths must exactly match the file names in the 'public/immagini-news' folder.
 * Using a hyphen instead of a space in the folder name is a web standard that avoids path encoding issues.
 */
const IMAGE_FOLDER = '/immagini-news';

export const predefinedImages = [
    { id: 'coffee', path: `${IMAGE_FOLDER}/coffee-4949530_1280.jpg` },
    { id: 'istock-2184', path: `${IMAGE_FOLDER}/istockphoto-2184622443-612x612.jpg` },
    { id: 'istock-9326', path: `${IMAGE_FOLDER}/istockphoto-932651650-612x612.jpg` },
    { id: 'old-newspaper', path: `${IMAGE_FOLDER}/old-newspaper-350376_1280.jpg` },
];

/**
 * A helper function to safely get an image path.
 * This can be expanded later to handle more complex logic if needed.
 * @param imagePath The path stored in the news article data.
 * @returns A safe, usable path, or null if the input is invalid.
 */
export const getSafeImagePath = (imagePath: string | null): string | null => {
    if (!imagePath) return null;
    // This could be used in the future to migrate old paths with spaces if necessary
    return imagePath;
};
