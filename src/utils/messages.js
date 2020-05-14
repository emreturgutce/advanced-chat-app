const generateMessage = (username, text) => {
  return {
    username,
    text,
    createdAt: new Date().getTime()
  };
};

const generateLocation = (username, url) => {
  return {
    username,
    url,
    createdAt: new Date().getTime()
  };
};

const generateImage = (username, binary) => {
  return {
    username,
    url: binary,
    createdAt: new Date().getTime()
  };
};

module.exports = { generateMessage, generateLocation, generateImage };
