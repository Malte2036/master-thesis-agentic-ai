export default function Test({foo}) {

    console.log('Test rendered with props:', {
        foo: foo
    });

    useEffect(() => {
        console.log('Test props updated:', {
            foo: foo
        });
    }, [foo]);

    return (
        <div>
            <h1>Test: {JSON.stringify(foo)}</h1>
        </div>
    );
}