'use server';
/**
 * @fileOverview A Genkit flow that generates diverse and realistic mock visitor data for a visitor management system.
 *
 * - generateMockVisitorData - A function that handles the generation of mock visitor data.
 * - GenerateMockVisitorDataInput - The input type for the generateMockVisitorData function.
 * - GenerateMockVisitorDataOutput - The return type for the generateMockVisitorData function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * Schema for vehicle details, used for 'Transportista' entry types.
 */
const VehicleDetailsSchema = z.object({
  type: z.string().describe('Type of vehicle (e.g., Truck, Van, Car, Motorcycle).'),
  licensePlate: z.string().describe('Vehicle license plate number (e.g., ABC-1234, 1234-XYZ).'),
});

/**
 * Schema for a single visitor record, encompassing both 'Transportista' and 'Personal' types.
 */
const VisitorSchema = z.object({
  id: z.string().describe('Unique identifier for the visitor (e.g., a UUID or simple sequential number).'),
  visitorName: z.string().describe("The visitor's full name (e.g., Juan Perez, Maria Lopez)."),
  companyName: z.string().describe("The visitor's company name (e.g., Transportes Unidos, Soluciones S.A.)."),
  purposeOfVisit: z.string().describe("The purpose of the visitor's entry (e.g., Delivery of goods, Business meeting, Interview)."),
  entryType: z.enum(['Transportista', 'Personal']).describe('Type of entry: "Transportista" for transporters or "Personal" for general visitors.'),
  entryDateTime: z.string().datetime().describe('The date and time of entry in ISO 8601 format (e.g., "2023-10-27T10:30:00Z"). Should be recent and varied for each entry.'),
  vehicleDetails: VehicleDetailsSchema.optional().describe('Required if entryType is "Transportista". Details about the vehicle.'),
  hostName: z.string().optional().describe('Required if entryType is "Personal". The name of the person being visited (e.g., Carlos Gomez, Ana Rodriguez).'),
});

/**
 * Input schema for generating mock visitor data.
 */
const GenerateMockVisitorDataInputSchema = z.object({
  count: z.number().int().min(1).max(20).default(5).describe('Number of mock visitor records to generate. Must be between 1 and 20.'),
});
export type GenerateMockVisitorDataInput = z.infer<typeof GenerateMockVisitorDataInputSchema>;

/**
 * Output schema for generated mock visitor data, an array of VisitorSchema objects.
 */
const GenerateMockVisitorDataOutputSchema = z.array(VisitorSchema);
export type GenerateMockVisitorDataOutput = z.infer<typeof GenerateMockVisitorDataOutputSchema>;

/**
 * Defines a prompt for generating diverse mock visitor data.
 * The prompt instructs the AI to create records alternating between 'Transportista' and 'Personal'
 * entry types and populating specific fields based on the entry type.
 */
const generateMockVisitorDataPrompt = ai.definePrompt({
  name: 'generateMockVisitorDataPrompt',
  input: { schema: GenerateMockVisitorDataInputSchema },
  output: { schema: GenerateMockVisitorDataOutputSchema },
  prompt: `You are an AI assistant specialized in generating realistic and diverse mock data for a visitor management system.
Your task is to generate {{count}} mock visitor records.

For each visitor record, ensure:
- 'id' is a unique string (e.g., a simple sequential number or short alphanumeric ID).
- 'entryType' provides a good mix between "Transportista" and "Personal" entries.
- 'visitorName', 'companyName', 'purposeOfVisit', and 'entryDateTime' are populated with realistic and varied data.
- 'entryDateTime' should represent recent times and dates.
- If 'entryType' is "Transportista":
  - 'vehicleDetails' must be provided with realistic 'type' and 'licensePlate' values.
  - 'hostName' should not be present.
- If 'entryType' is "Personal":
  - 'hostName' must be provided with a realistic name.
  - 'vehicleDetails' should not be present.

Generate the data in JSON format matching the provided schema. Do not include any additional text or formatting outside the JSON array.`,
});

/**
 * Defines the Genkit flow for generating mock visitor data.
 * This flow takes a count as input and uses the AI prompt to generate a list of visitor records.
 */
const generateMockVisitorDataFlow = ai.defineFlow(
  {
    name: 'generateMockVisitorDataFlow',
    inputSchema: GenerateMockVisitorDataInputSchema,
    outputSchema: GenerateMockVisitorDataOutputSchema,
  },
  async (input) => {
    const { output } = await generateMockVisitorDataPrompt(input);
    return output!;
  }
);

/**
 * Wrapper function to call the generateMockVisitorDataFlow.
 * @param input - The input parameters for generating mock visitor data.
 * @returns A promise that resolves to the generated mock visitor data.
 */
export async function generateMockVisitorData(input: GenerateMockVisitorDataInput): Promise<GenerateMockVisitorDataOutput> {
  return generateMockVisitorDataFlow(input);
}
