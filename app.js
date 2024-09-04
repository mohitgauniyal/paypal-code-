const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const paypal = require("paypal-rest-sdk");

// PayPal configuration
paypal.configure({
  mode: "sandbox", // Change to 'live' for production
  client_id: "AV7erYJebzvhRGnRykgHpNlx6c84c2mFrJ8npGXvdfmiFZE1qUlR8tCSW9756cNgvaFSjn11vtG3ezLJ", // Replace with your actual client ID
  client_secret: "ECt37xjSScTu7EEiNs1X3Mc4vrLowZPFSzwnycTCFQolFdpqYYyfnz0hR5nSpxYCL2hUGT0D86_sLLAM", // Replace with your actual client secret
});

const app = express();

// Middleware
app.use(cors()); // Enable CORS
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Endpoint 1: Create a Payment
app.post("/pay", (req, res) => {
  const { email, name, totalAmount } = req.body;

  const create_payment_json = {
    intent: "sale",
    payer: {
      payment_method: "paypal",
    },
    redirect_urls: {
      return_url: "http://localhost:3000/success",
      cancel_url: "http://localhost:3000/cancel",
    },
    transactions: [
      {
        item_list: {
          items: [
            {
              name: "Core REI System",
              sku: "001",
              price: totalAmount,
              currency: "USD",
              quantity: 1,
            },
          ],
        },
        amount: {
          currency: "USD",
          total: totalAmount,
        },
        description: `Payment for ${name} (${email})`,
      },
    ],
  };

  paypal.payment.create(create_payment_json, (error, payment) => {
    if (error) {
      console.error(error.response);
      res.status(500).send("Error creating payment");
    } else {
      const approvalUrl = payment.links.find(link => link.rel === "approval_url");
      if (approvalUrl) {
        res.json({ approval_url: approvalUrl.href });
      } else {
        res.status(500).send("Approval URL not found");
      }
    }
  });
});

// Endpoint 2: Execute Payment (Success)
app.get("/success", (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;
  const totalAmount = req.query.totalAmount;

  const execute_payment_json = {
    payer_id: payerId,
    transactions: [
      {
        amount: {
          currency: "USD",
          total: totalAmount,
        },
      },
    ],
  };

  paypal.payment.execute(paymentId, execute_payment_json, (error, payment) => {
    if (error) {
      console.error(error.response);
      res.status(500).send("Payment execution failed");
    } else {
      console.log("Payment successful");
      res.send("Payment successful");
    }
  });
});

// Endpoint 3: Cancel Payment
app.get("/cancel", (req, res) => res.send("Payment cancelled"));

// Start the server
app.listen(3000, () => console.log("Server started on port 3000"));
