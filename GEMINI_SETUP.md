# Setting Up Google Gemini API

## Getting Your Gemini API Key

1. **Visit Google AI Studio**: Go to [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)

2. **Sign in with Google**: Use your Google account to sign in

3. **Create API Key**: Click "Create API key" button

4. **Copy the Key**: Copy the generated API key

5. **Add to Environment**: 
   - Open the `.env` file in the project root
   - Replace `your_gemini_api_key_here` with your actual API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

## API Limits and Pricing

- **Free Tier**: Google Gemini API offers a generous free tier
- **Rate Limits**: 60 requests per minute for free tier
- **Usage Tracking**: Monitor your usage in the Google AI Studio

## Model Used

This project uses the `gemini-1.5-flash` model, which is Google's fast and efficient text generation model. This model provides excellent performance for conversational AI applications.

## Troubleshooting

### Common Issues:

1. **Invalid API Key Error**:
   - Double-check your API key is correct
   - Ensure no extra spaces in the .env file
   - Make sure the API key has the correct permissions

2. **Rate Limit Exceeded**:
   - Wait a minute before making more requests
   - Consider implementing request throttling for production use

3. **CORS Errors**:
   - These shouldn't occur since API calls are made from the backend
   - If you see CORS errors, check that your frontend is making requests to the backend, not directly to Google

## Security Note

⚠️ **IMPORTANT**: Never commit your API key to version control! 

- The `.env` file is already added to `.gitignore` to prevent accidental exposure
- Use the provided `.env.example` file as a template
- For production deployments, use environment variables or secure secret management
- Regenerate your API key immediately if it's ever accidentally exposed