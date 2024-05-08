import { exec } from "child_process";
import cors from "cors";
import express from "express";
import { promises as fs } from "fs";

const app = express();
app.use(express.json());
app.use(cors());
const port = 3000;

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  if (userMessage === "hi" || userMessage === "intro") {
    const name = "Wilson";
    const text = `Hi ${name}, welcome to aspirez, happy to help you towards the career development journey`;
    const fileName = "output_0";

    try {
      // Generate audio file from the introduction text
      await generateAudioFile(text, fileName, "Samantha");

      const inputFileAIFF = `audios/${fileName}.aiff`;
      const outputFileWAV = `audios/${fileName}.wav`;
      const outputFileJSON = `audios/${fileName}.json`;

      // Convert audio to WAV
      await convertAIFFtoWAV(inputFileAIFF, outputFileWAV);

      // Generate lip sync JSON after both audio and WAV conversion are completed
      await convertWAVtoLipSyncJSON(outputFileWAV, outputFileJSON);

      // Send response with audio and lip sync data
      res.send({
        messages: [
          {
            audio: await audioFileToBase64(outputFileWAV),
            lipsync: await readJsonTranscript(outputFileJSON),
            facialExpression: "smile",
            animation: "Talking_1",
          }
        ]
      });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send("Internal Server Error");
    } finally {
      // Delete temporary files
      await deleteFiles([
        `${fileName}.wav`,
        `${fileName}.json`,
        `${fileName}.aiff`
      ]);
      console.log("Temporary files deleted successfully.");
    }
  } else {
    res.status(400).send("Invalid request");
  }
});

const generateAudioFile = async (text, fileName, voice = "Samantha") => {
  return new Promise((resolve, reject) => {
    exec(`say -v ${voice} -o audios/${fileName}.aiff ${text}`, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

const convertAIFFtoWAV = async (inputFile, outputFile) => {
  return new Promise((resolve, reject) => {
    exec(`ffmpeg -i ${inputFile} ${outputFile}`, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

const convertWAVtoLipSyncJSON = async (inputFile, outputFile) => {
  return new Promise((resolve, reject) => {
    exec(`./bin/rhubarb -f json -o ${outputFile} ${inputFile} -r phonetic`, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

const deleteFiles = async (files) => {
  await Promise.all(files.map(async (file) => {
    try {
      await fs.unlink(`audios/${file}`);
      console.log(`File audios/${file} deleted successfully.`);
    } catch (error) {
      console.error(`Error deleting file audios/${file}:`, error);
    }
  }));
};

const readJsonTranscript = async (file) => {
  const data = await fs.readFile(file, "utf8");
  return JSON.parse(data);
};

const audioFileToBase64 = async (file) => {
  const data = await fs.readFile(file);
  return data.toString("base64");
};

app.listen(port, () => {
  console.log(`Your project is listening on port ${port}`);
});