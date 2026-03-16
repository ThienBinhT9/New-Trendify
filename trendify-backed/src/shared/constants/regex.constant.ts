export const REGEXT_EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9]+\.com$/;
export const REGEXT_PASSWORD = /^(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
export const REGEXT_NUMBERPHONE = /^(0)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-5|8|9]|9[0-9])[0-9]{7}$/;
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const MONGODB_OBJECTID_REGEX = /^[0-9a-f]{24}$/i;
