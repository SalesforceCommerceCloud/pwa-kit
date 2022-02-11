/// <reference types="react" />
interface Props {
    dadJoke: string;
}
declare const Home: {
    ({ dadJoke }: Props): JSX.Element;
    getTemplateName(): string;
    getProps(req: any, res: any): Promise<{
        dadJoke: any;
    }>;
};
export default Home;
