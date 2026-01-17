import { generateResponse } from "../src/services/aiService";
 
//this uses the real GEMINI API key, be careful not to waste the whole shit ⛔😅
describe("Ai Test",()=>{
  it("should Answer the User", async () =>{
    const result = await generateResponse(
        'Can you tell me how much i spent this month',
        'money spent this month : 1000dh'
    );
    console.log(result);
    expect(result).not.toBe("Something went wrong");
  })
})