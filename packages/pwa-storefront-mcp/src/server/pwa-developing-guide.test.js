import { EmptySchema, EmptyJsonSchema, Developing_Composeable_Storefront_Guidelines } from './pwa-developing-guide';

describe('PWA Development Guidelines', () => {
    describe('EmptySchema', () => {
        it('should be a valid zod schema', () => {
            expect(EmptySchema).toBeDefined();
            expect(typeof EmptySchema.parse).toBe('function');
        });

        it('should allow empty objects', () => {
            expect(() => EmptySchema.parse({})).not.toThrow();
        });

        it('should reject objects with extra properties', () => {
            expect(() => EmptySchema.parse({ extra: 'property' })).toThrow();
        });
    });

    describe('EmptyJsonSchema', () => {
        it('should be a valid JSON schema', () => {
            expect(EmptyJsonSchema).toEqual({
                type: 'object',
                properties: {},
                additionalProperties: false
            });
        });
    });

    describe('Developing_Composeable_Storefront_Guidelines', () => {
        it('should have correct structure', () => {
            expect(Developing_Composeable_Storefront_Guidelines).toMatchObject({
                name: 'pwa-developing-guide',
                description: expect.any(String),
                inputSchema: expect.any(Object),
                fn: expect.any(Function)
            });
        });

        it('should return guidelines content when executed', async () => {
            const result = await Developing_Composeable_Storefront_Guidelines.fn();
            
            expect(result).toEqual({
                content: [{
                    type: 'text',
                    text: expect.stringContaining('Salesforce Commerce Composable Storefront Development Guidelines')
                }]
            });
        });

        it('should include all major sections in the guidelines', async () => {
            const result = await Developing_Composeable_Storefront_Guidelines.fn();
            const guidelineText = result.content[0].text;

            const requiredSections = [
                'Overview',
                'Core Principles',
                'Technical Stack',
                'Best Practices',
                'PWA Kit Storefront Project Structure',
                'Quality Standards'
            ];

            requiredSections.forEach(section => {
                expect(guidelineText).toContain(section);
            });
        });
    });
}); 