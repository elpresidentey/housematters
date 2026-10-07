const express = require('express');
const router = express.Router();
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');
const { uploadSingle, uploadMultiple } = require('../middleware/upload');
const { putImage, deleteImage } = require('../config/storage');

// sharp is optional: resize when available, otherwise store the original.
// It needs a native build, so it is loaded defensively and skipped if it fails.
let sharp = null;
try {
    sharp = require('sharp');
} catch (e) {
    console.warn('sharp unavailable, storing original images:', e.message);
}

const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
const CONTENT_TYPES = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp'
};

async function storeFile(file) {
    let ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) ext = '.jpg';

    let buffer = file.buffer;
    let finalExt = ext;
    if (sharp) {
        try {
            buffer = await sharp(file.buffer)
                .resize(1200, null, { withoutEnlargement: true })
                .jpeg({ quality: 82 })
                .toBuffer();
            finalExt = '.jpg';
        } catch (e) {
            console.warn('sharp processing failed, storing original:', e.message);
            buffer = file.buffer;
            finalExt = ext;
        }
    }

    const key = `${uuidv4()}${finalExt}`;
    const stored = await putImage(buffer, key, CONTENT_TYPES[finalExt] || 'image/jpeg');
    return { url: stored.url, key: stored.key };
}

// Upload multiple images (up to 10) — field name: "images"
router.post('/multiple', authenticateToken, uploadMultiple('images', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: { code: 'NO_FILES', message: 'No files uploaded' }
            });
        }

        const files = [];
        for (const file of req.files) {
            files.push(await storeFile(file));
        }

        res.status(201).json({ success: true, data: { files } });
    } catch (error) {
        console.error('Multiple image upload error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'UPLOAD_ERROR', message: 'Failed to upload images' }
        });
    }
});

// Upload single image — field name: "image"
router.post('/single', authenticateToken, uploadSingle('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: { code: 'NO_FILE', message: 'No file uploaded' }
            });
        }

        const stored = await storeFile(req.file);
        res.status(201).json({ success: true, data: stored });
    } catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'UPLOAD_ERROR', message: 'Failed to upload image' }
        });
    }
});

// Delete image
router.delete('/:key', authenticateToken, async (req, res) => {
    try {
        // basename() strips any traversal attempt before the key reaches storage.
        const key = path.basename(req.params.key);
        await deleteImage(key);
        res.json({ success: true, data: { message: 'Image deleted successfully' } });
    } catch (error) {
        console.error('Image deletion error:', error);
        const missing = /not found/i.test(error.message || '');
        res.status(missing ? 404 : 500).json({
            success: false,
            error: { code: missing ? 'NOT_FOUND' : 'DELETE_ERROR', message: missing ? 'Image not found' : 'Failed to delete image' }
        });
    }
});

module.exports = router;