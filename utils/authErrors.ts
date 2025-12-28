
export function getAuthErrorMessage(error: any): string {
    const code = error.code || error.message;

    if (!code) return "An unexpected error occurred. Please try again.";

    switch (code) {
        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
            return "Incorrect email or password. Please check your details and try again.";
        case "auth/email-already-in-use":
            return "This email is already registered. Please log in instead.";
        case "auth/weak-password":
            return "Password is too weak. Please use at least 6 characters.";
        case "auth/invalid-email":
            return "Please enter a valid email address.";
        case "auth/network-request-failed":
            return "Network error. Please check your internet connection.";
        case "auth/too-many-requests":
            return "Too many failed attempts. Please try again later.";
        case "auth/user-disabled":
            return "This account has been disabled. Please contact support.";
        default:
            // If it's a raw string message that makes sense, keep it, otherwise generic
            if (typeof error.message === 'string' && error.message.length < 100) {
                return error.message;
            }
            return "An error occurred. Please try again.";
    }
}
