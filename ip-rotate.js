// const generateUniqueIPs = (count) => {
//   const ipSet = new Set();

//   while (ipSet.size < count) {
//     const ip = `${Math.floor(Math.random() * 256)}.${Math.floor(
//       Math.random() * 256
//     )}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
//     ipSet.add(ip);
//   }

//   return [...ipSet];
// };

// const ipList = generateUniqueIPs(10000); // Change these

// // module.exports = {
// //   beforeRequest: (req, context, ee, next) => {
// //     const ip = ipList[Math.floor(Math.random() * ipList.length)];
// //     req.headers["X-Forwarded-For"] = `${ip}`;
// //     req.localAddress = ip;
// //     return next();
// //   }
// // };

// module.exports = {
//   setRandomIP: function (req, events, done) {
//     function getRandomIP() {
//       return ipList[Math.floor(Math.random() * ipList.length)];
//     }

//     const randomIP = getRandomIP();

//     req.vars.ip = randomIP;
//     req.headers = {
//       ...req.headers,
//       "X-Forwarded-For": randomIP,
//       "Client-IP": randomIP,
//       "CF-Connecting-IP": randomIP,
//       "True-Client-IP": randomIP,
//       "X-Real-IP": randomIP
//     };

//     return done();
//   }
// };

const usedIPs = new Set();

function generateUniqueIP() {
  let ip;
  do {
    ip = `${Math.floor(Math.random() * 256)}.${Math.floor(
      Math.random() * 256
    )}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
  } while (usedIPs.has(ip)); // Ensure uniqueness

  usedIPs.add(ip);
  return ip;
}

module.exports = {
  setRandomIP: function (userContext, events, done) {
    const randomIP = generateUniqueIP();
    userContext.vars.ip = randomIP; // Assign IP to user session
    return done();
  }
};
