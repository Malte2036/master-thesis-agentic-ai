import chainlit as cl

@cl.on_chat_start
async def start():
    element = cl.CustomElement(name="Test", props={"foo": "bar"})
    cl.user_session.set("element", element)

@cl.on_message
async def on_message():
    element = cl.user_session.get("element")
    element.props["foo"] = "baz"
    await element.update()