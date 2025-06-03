import fs from "fs";
import readline from "readline";

// Step 1: Clean and transform original MongoDB-style data
async function cleanMongoData(inputPath, cleanedOutputPath, lineOutputPath) {
  const fileStream = fs.createReadStream(inputPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const cleaned = [];

  for await (const line of rl) {
    if (!line.trim()) continue;
    let obj = JSON.parse(line);

    // Remove __v
    delete obj.__v;

    // Rename _id to id
    if (obj._id) {
      obj.id = obj._id.$oid || obj._id;
      delete obj._id;
    }

    // Convert createdAt/updatedAt
    if (obj.createdAt && obj.createdAt.$date)
      obj.createdAt = obj.createdAt.$date;
    if (obj.updatedAt && obj.updatedAt.$date)
      obj.updatedAt = obj.updatedAt.$date;

    // Flatten answers
    if (Array.isArray(obj.answers)) {
      obj.answers = obj.answers.map((ans) => {
        if (ans._id && ans._id.$oid) {
          ans.id = ans._id.$oid;
          delete ans._id;
        }
        return ans;
      });
    }

    cleaned.push(obj);
  }

  // Save cleaned full JSON
  fs.writeFileSync(cleanedOutputPath, JSON.stringify(cleaned, null, 2));
  console.log(`✅ Cleaned data saved to ${cleanedOutputPath}`);

  // Save line-by-line version for DynamoDB conversion
  const lines = cleaned.map((obj) => JSON.stringify(obj)).join("\n");
  fs.writeFileSync(lineOutputPath, lines);
  console.log(`✅ Line-by-line JSON saved to ${lineOutputPath}`);
}

// Step 2: Convert to DynamoDB JSON format
function toDynamoDBValue(value) {
  if (typeof value === "string") {
    return { S: value };
  }
  if (typeof value === "number") {
    return { N: value.toString() };
  }
  if (typeof value === "boolean") {
    return { BOOL: value };
  }
  if (Array.isArray(value)) {
    return {
      L: value.map(toDynamoDBValueOrMap),
    };
  }
  if (value === null || value === undefined) {
    return { NULL: true };
  }
  if (typeof value === "object") {
    return {
      M: Object.entries(value).reduce((acc, [k, v]) => {
        acc[k] = toDynamoDBValue(v);
        return acc;
      }, {}),
    };
  }
}

function toDynamoDBValueOrMap(value) {
  if (typeof value === "object" && !Array.isArray(value) && value !== null) {
    return {
      M: Object.entries(value).reduce((acc, [k, v]) => {
        acc[k] = toDynamoDBValue(v);
        return acc;
      }, {}),
    };
  } else {
    return toDynamoDBValue(value);
  }
}

// Step 3: Convert cleaned lines to DynamoDB JSON lines
async function convertToDynamoFormat(lineInputPath, finalOutputPath) {
  const readStream = fs.createReadStream(lineInputPath);
  const writeStream = fs.createWriteStream(finalOutputPath);
  const rl = readline.createInterface({
    input: readStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (line.trim()) {
      const obj = JSON.parse(line);
      const dynamoItem = { Item: {} };

      for (const [key, val] of Object.entries(obj)) {
        dynamoItem.Item[key] = toDynamoDBValue(val);
      }

      writeStream.write(JSON.stringify(dynamoItem) + "\n");
    }
  }

  writeStream.end();
  console.log(`✅ DynamoDB-ready JSON saved to ${finalOutputPath}`);
}

// Run all steps in order
async function runPipeline() {
  const inputPath = "questions.json";
  const cleanedOutputPath = "questions_cleaned.json";
  const lineOutputPath = "questions_cleaned-lines.json";
  const dynamoOutputPath = "questions2_dynamodb.json";

  await cleanMongoData(inputPath, cleanedOutputPath, lineOutputPath);
  await convertToDynamoFormat(lineOutputPath, dynamoOutputPath);
}

runPipeline().catch(console.error);
