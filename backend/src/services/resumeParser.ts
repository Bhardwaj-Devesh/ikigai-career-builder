import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { config } from '../config';

interface PersonalInfo {
  name: string | null;
  title: string | null;
  linkedin_url: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
}

interface Experience {
  company: string | null;
  location: string | null;
  role: string | null;
  start_date: string | null;
  end_date: string | null;
  responsibilities: string[] | null;
}

interface Education {
  institution: string | null;
  location: string | null;
  degree: string | null;
  start_date: string | null;
  end_date: string | null;
}

interface TechnicalSkills {
  technical_skills: string[] | null;
  frameworks_libraries: string[] | null;
  tools: string[] | null;
}

interface Project {
  project_name: string | null;
  description: string | null;
  tech_stack: string[] | null;
}

interface ResumeData {
  personal_info: PersonalInfo | null;
  professional_experience: Experience[] | null;
  education: Education[] | null;
  technical_skills: TechnicalSkills | null;
  additional_information: string[] | null;
  projects: Project[] | null;
}

export async function parseResume(
  fileBuffer: Buffer,
  mimeType: string
): Promise<ResumeData | null> {
  let text: string;

  // Extract text based on file type
  if (mimeType === 'application/pdf') {
    text = await extractTextFromPDF(fileBuffer);
  } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    text = await extractTextFromDOCX(fileBuffer);
  } else {
    throw new Error('Unsupported file type');
  }

  // Use AI to parse the extracted text
  const parsedData = await extract_resume_details(text);
  console.log(parsedData);
  return parsedData;
}

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    throw new Error('Failed to extract text from DOCX');
  }
}

async function extract_resume_details(resume_content: string): Promise<ResumeData | null> {
  const apiKey = config.gemini.apiKey;

  if (!apiKey) {
    console.error('GEMINI_API is not configured in config.ts.');
    return null;
  }

  const prompt = `
  Extract ONLY the information that is EXPLICITLY mentioned in the resume content provided below.
  DO NOT make any assumptions or inferences about missing information.
  If a piece of information is not explicitly stated in the resume, set it to null.
  Format the extracted information as a JSON object according to the schema provided.

  Resume Content:
  \`\`\`
  ${resume_content}
  \`\`\`

  JSON Schema:
  \`\`\`json
  {
    "personal_info": {
      "name": "string | null",
      "title": "string | null",
      "linkedin_url": "string | null",
      "email": "string | null",
      "phone": "string | null",
      "location": "string | null"
    },
    "professional_experience": [
      {
        "company": "string | null",
        "location": "string | null",
        "role": "string | null",
        "start_date": "string | null",
        "end_date": "string | null",
        "responsibilities": "list[string] | null"
      }
    ],
    "education": [
      {
        "institution": "string | null",
        "location": "string | null",
        "degree": "string | null",
        "start_date": "string | null",
        "end_date": "string | null"
      }
    ],
    "technical_skills": {
      "technical_skills": "list[string] | null",
      "frameworks_libraries": "list[string] | null",
      "tools": "list[string] | null"
    },
    "additional_information": "list[string] | null",
    "projects": [
      {
        "project_name": "string | null",
        "description": "string | null",
        "tech_stack": "list[string] | null"
      }
    ]
  }
  \`\`\`

  Important Rules:
  1. ONLY extract information that is EXPLICITLY stated in the resume
  2. DO NOT make assumptions about missing information
  3. DO NOT infer or guess values for any fields
  4. If a field is not explicitly mentioned, set it to null
  5. For dates, only extract if they are clearly stated in the resume
  6. For skills, only include those that are explicitly listed
  7. For projects, only include those that are clearly described
  8. For responsibilities, only include those that are explicitly stated
  9. If a section is not present in the resume, set all its fields to null
  10. Do not generate or infer any information that is not directly present in the resume

  Project Extraction Rules:
  1. Look for projects in ANY section of the resume, not just dedicated project sections
  2. Identify projects by looking for:
     - Project names or titles
     - Descriptions of work that appears to be a project
     - Bullet points or paragraphs that describe a specific project
     - Work that was done as part of a project
  3. Each project should have a name (can be extracted from the description if not explicitly stated)
  4. Include all projects mentioned anywhere in the resume
  5. If a project has no description, set it to an empty string
  6. Do not skip any projects mentioned in the resume
  7. For each project, extract the tech stack mentioned in its description
  8. Tech stack should include all technologies, frameworks, and tools mentioned for that specific project
  9. If no tech stack is mentioned for a project, set it to an empty list
  10. Projects can be found in:
       - Work experience sections
       - Dedicated project sections
       - Portfolio sections
       - Any other section that describes project work

  Ensure that the JSON object is valid and all extracted information is placed in the correct fields.
  If a piece of information is not found, set the corresponding field to null.
  For lists, if no items are found, return an empty list.
  `

  const maxRetries = 3; // Maximum number of retries
  const retryDelayMs = 1000; // Initial delay in milliseconds (1 second)

  for (let i = 0; i <= maxRetries; i++) {
    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3,
            maxOutputTokens: 2000,
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawJsonText) {
          console.error('Gemini API response did not contain text content in the expected format.', data);
          return null;
        }

        try {
          const parsedContent: ResumeData = JSON.parse(rawJsonText);
          return parsedContent;
        } catch (jsonError: any) {
          console.error('Error parsing Gemini API JSON response:', jsonError, 'Raw text:', rawJsonText);
          // If JSON parsing consistently fails, might not be a transient error
          throw new Error(`Failed to parse Gemini API response: ${jsonError.message}`);
        }
      } else if (response.status === 503 || response.status === 429) {
        // Retry on 503 Service Unavailable or 429 Too Many Requests
        console.warn(`Gemini API temporary error (${response.status}). Retrying attempt ${i + 1} of ${maxRetries}...`);
        const delay = retryDelayMs * Math.pow(2, i); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        // Continue to the next iteration of the loop for retry
        continue;
      } else {
        // For other non-OK responses, log error and don't retry
        const errorBody = await response.text();
        console.error(`Gemini API error: ${response.status} ${response.statusText}`, errorBody);
        throw new Error(`Gemini API failed with status ${response.status}: ${response.statusText}`);
      }

    } catch (error: any) {
      console.error(`Error during Gemini API call (attempt ${i + 1} of ${maxRetries}):`, error);
      if (i < maxRetries) {
        // Delay before the next retry if the catch block is hit by a network error etc.
        const delay = retryDelayMs * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue; // Continue to the next iteration for retry
      } else {
        // If max retries reached, re-throw the error
        throw error;
      }
    }
  }

  // If loop finishes without returning, all retries failed
  console.error(`Gemini API failed after ${maxRetries} retries.`);
  return null;
} 