import { ApiError } from "../utils/ApiError.js";

// Ye function ek 'schema' (rule book) parameter lega
export const validate = (schema) => async (req, res, next) => {
    try {
        // 1. Zod ko bolo ki "bhai check kar, req.body me jo data aaya hai kya wo pass hai?"
        const parseBody = await schema.parseAsync(req.body);

        // 2. Agar pass ho gaya, toh validated data ko request body me wapas rakh do
        req.body = parseBody;

        // 3. next() function call karo. Ye batata hai ki "Guard (middleware) ne pass kar diya hai, ab request ko aage Controller tak jaane do!"
        next();
    } catch (err) {
        // 4. Agar error aaya (matlab validation fail), tab yaha aayega
        
        // Zod multiple error ek sath bhejta hai (jaise Name short hai, email me '@' nahi hai)
        // Toh hum un sab errors ko map karke ek single sentence banate hain comma (,) laga ke
        const message = err.errors.map((e) => e.message).join(", ");
        
        // 5. Apni custom class (jo aapne utils/ApiError me banai hai) use karke Frontend walo ko error status 400 (Bad Request) wapas phek do
        next(new ApiError(400, message));
    }
};
