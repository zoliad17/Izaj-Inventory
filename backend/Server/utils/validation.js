const validator = require('validator');

// Input sanitization functions
const sanitizeInput = (input) => {
    if (typeof input === 'string') {
        return validator.escape(input.trim());
    }
    return input;
};

// Validation schemas
const validationSchemas = {
    email: (email) => {
        if (!email || typeof email !== 'string') {
            return { isValid: false, error: 'Email is required and must be a string' };
        }
        if (!validator.isEmail(email)) {
            return { isValid: false, error: 'Invalid email format' };
        }
        if (email.length > 255) {
            return { isValid: false, error: 'Email is too long' };
        }
        return { isValid: true };
    },

    password: (password) => {
        if (!password || typeof password !== 'string') {
            return { isValid: false, error: 'Password is required and must be a string' };
        }
        if (password.length < 8) {
            return { isValid: false, error: 'Password must be at least 8 characters long' };
        }
        if (password.length > 128) {
            return { isValid: false, error: 'Password is too long' };
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password)) {
            return { isValid: false, error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' };
        }
        return { isValid: true };
    },

    name: (name) => {
        if (!name || typeof name !== 'string') {
            return { isValid: false, error: 'Name is required and must be a string' };
        }
        const sanitized = sanitizeInput(name);
        if (sanitized.length < 2) {
            return { isValid: false, error: 'Name must be at least 2 characters long' };
        }
        if (sanitized.length > 100) {
            return { isValid: false, error: 'Name is too long' };
        }
        if (!/^[a-zA-Z\s'-]+$/.test(sanitized)) {
            return { isValid: false, error: 'Name contains invalid characters' };
        }
        return { isValid: true, sanitized };
    },

    contact: (contact) => {
        if (!contact || contact === null || contact === '') {
            return { isValid: true, sanitized: null };
        }
        const cleanContact = contact.toString().replace(/\D/g, '');
        if (cleanContact.length !== 11) {
            return { isValid: false, error: 'Contact number must be exactly 11 digits' };
        }
        if (!/^09\d{9}$/.test(cleanContact)) {
            return { isValid: false, error: 'Contact number must start with 09' };
        }
        return { isValid: true, sanitized: cleanContact };
    },

    contactRequired: (contact) => {
        if (!contact || contact === null || contact === '') {
            return { isValid: false, error: 'Contact number is required' };
        }
        const cleanContact = contact.toString().replace(/\D/g, '');
        if (cleanContact.length !== 11) {
            return { isValid: false, error: 'Contact number must be exactly 11 digits' };
        }
        if (!/^09\d{9}$/.test(cleanContact)) {
            return { isValid: false, error: 'Contact number must start with 09' };
        }
        return { isValid: true, sanitized: cleanContact };
    },

    productName: (name) => {
        if (!name || typeof name !== 'string') {
            return { isValid: false, error: 'Product name is required and must be a string' };
        }
        const sanitized = sanitizeInput(name);
        if (sanitized.length < 2) {
            return { isValid: false, error: 'Product name must be at least 2 characters long' };
        }
        if (sanitized.length > 200) {
            return { isValid: false, error: 'Product name is too long' };
        }
        return { isValid: true, sanitized };
    },

    price: (price) => {
        if (price === null || price === undefined) {
            return { isValid: false, error: 'Price is required' };
        }
        const numPrice = parseFloat(price);
        if (isNaN(numPrice)) {
            return { isValid: false, error: 'Price must be a valid number' };
        }
        if (numPrice < 0) {
            return { isValid: false, error: 'Price cannot be negative' };
        }
        if (numPrice > 999999.99) {
            return { isValid: false, error: 'Price is too high' };
        }
        return { isValid: true, sanitized: numPrice };
    },

    quantity: (quantity) => {
        if (quantity === null || quantity === undefined) {
            return { isValid: false, error: 'Quantity is required' };
        }
        const numQuantity = parseInt(quantity);
        if (isNaN(numQuantity)) {
            return { isValid: false, error: 'Quantity must be a valid number' };
        }
        if (numQuantity < 0) {
            return { isValid: false, error: 'Quantity cannot be negative' };
        }
        if (numQuantity > 999999) {
            return { isValid: false, error: 'Quantity is too high' };
        }
        return { isValid: true, sanitized: numQuantity };
    },

    id: (id) => {
        if (!id) {
            return { isValid: false, error: 'ID is required' };
        }
        const numId = parseInt(id);
        if (isNaN(numId) || numId <= 0) {
            return { isValid: false, error: 'ID must be a positive number' };
        }
        return { isValid: true, sanitized: numId };
    },

    uuid: (uuid) => {
        if (!uuid || typeof uuid !== 'string') {
            return { isValid: false, error: 'UUID is required and must be a string' };
        }
        if (!validator.isUUID(uuid)) {
            return { isValid: false, error: 'Invalid UUID format' };
        }
        return { isValid: true, sanitized: uuid };
    }
};

// Middleware for validating request body
const validateRequest = (schema) => {
    return (req, res, next) => {
        const errors = [];
        const sanitizedData = {};

        for (const [field, value] of Object.entries(req.body)) {
            if (schema[field]) {
                const validation = schema[field](value);
                if (!validation.isValid) {
                    errors.push({ field, error: validation.error });
                } else {
                    sanitizedData[field] = validation.sanitized !== undefined ? validation.sanitized : value;
                }
            } else {
                sanitizedData[field] = value;
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors
            });
        }

        req.body = sanitizedData;
        next();
    };
};

// Common validation schemas
const schemas = {
    login: {
        email: validationSchemas.email,
        password: (password) => {
            if (!password || typeof password !== 'string') {
                return { isValid: false, error: 'Password is required' };
            }
            return { isValid: true };
        }
    },

    user: {
        name: validationSchemas.name,
        email: validationSchemas.email,
        password: validationSchemas.password,
        contact: validationSchemas.contact,
        role_id: validationSchemas.id,
        branch_id: (id) => {
            if (id === null || id === undefined) {
                return { isValid: true, sanitized: null };
            }
            return validationSchemas.id(id);
        }
    },

    pendingUser: {
        name: validationSchemas.name,
        email: validationSchemas.email,
        contact: validationSchemas.contactRequired, // Required for pending users
        role_id: validationSchemas.id,
        branch_id: (id) => {
            if (id === null || id === undefined) {
                return { isValid: true, sanitized: null };
            }
            return validationSchemas.id(id);
        }
    },

    product: {
        name: validationSchemas.productName,
        price: validationSchemas.price,
        stock: validationSchemas.quantity,
        category: validationSchemas.id,
        status: (status) => {
            const validStatuses = ['In Stock', 'Out of Stock', 'Low Stock'];
            if (!validStatuses.includes(status)) {
                return { isValid: false, error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') };
            }
            return { isValid: true, sanitized: status };
        },
        branch_id: validationSchemas.id
    },

    productRequest: {
        requestFrom: validationSchemas.uuid,
        requestTo: validationSchemas.uuid,
        items: (items) => {
            if (!Array.isArray(items) || items.length === 0) {
                return { isValid: false, error: 'Items array is required and cannot be empty' };
            }
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (!item.product_id || !item.quantity) {
                    return { isValid: false, error: `Item ${i + 1}: product_id and quantity are required` };
                }
                const productIdValidation = validationSchemas.id(item.product_id);
                const quantityValidation = validationSchemas.quantity(item.quantity);
                if (!productIdValidation.isValid) {
                    return { isValid: false, error: `Item ${i + 1}: ${productIdValidation.error}` };
                }
                if (!quantityValidation.isValid) {
                    return { isValid: false, error: `Item ${i + 1}: ${quantityValidation.error}` };
                }
            }
            return { isValid: true, sanitized: items };
        },
        notes: (notes) => {
            if (notes === null || notes === undefined) {
                return { isValid: true, sanitized: null };
            }
            if (typeof notes !== 'string') {
                return { isValid: false, error: 'Notes must be a string' };
            }
            const sanitized = sanitizeInput(notes);
            if (sanitized.length > 1000) {
                return { isValid: false, error: 'Notes are too long' };
            }
            return { isValid: true, sanitized };
        }
    }
};

module.exports = {
    validationSchemas,
    validateRequest,
    schemas,
    sanitizeInput
};
