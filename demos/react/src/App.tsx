import React from 'react';
import {Invoice, LightningAddress} from '@getalby/lightning-tools';
import {
  Button,
  init,
  launchPaymentModal,
  requestProvider,
  Connect,
  Payment,
  launchModal,
  PayButton,
} from '@getalby/bitcoin-connect-react';
import toast, {Toaster} from 'react-hot-toast';
import {SendPaymentResponse} from '@webbtc/webln-types';

init({
  appName: 'Bitcoin Connect (React Demo)',
  providerConfig: {
    uma: {
      callbackUrl: window.location.href,
      identityNpub:
        'npub1mjkxztcmws45vn04u5gtrr6smyt0pyzvn7ag6q4uzgnguzkwcw5saxkfm0',
      identityRelayUrl: 'wss://nos.lol',
    },
  },
});

function App() {
  const [invoice, setInvoice] = React.useState<Invoice | undefined>(undefined);
  const [preimage, setPreimage] = React.useState<string | undefined>(undefined);
  const [createdInvoice, setCreatedInvoice] = React.useState<
    string | undefined
  >(undefined);
  const [umaAddress, setUmaAddress] = React.useState<string | undefined>(
    undefined
  );
  const [lookupResult, setLookupResult] = React.useState<string | undefined>(
    undefined
  );
  const [paymentModalSetPaidFunction, setPaymentModalSetPaidFunction] =
    React.useState<((response: SendPaymentResponse) => void) | undefined>(
      undefined
    );
  const [quoteCurrency, setQuoteCurrency] = React.useState<string | undefined>(
    undefined
  );
  const [quoteAmount, setQuoteAmount] = React.useState<number | undefined>(
    undefined
  );
  const [quoteResult, setQuoteResult] = React.useState<string | undefined>(
    undefined
  );

  React.useEffect(() => {
    (async () => {
      try {
        const ln = new LightningAddress('hello@getalby.com');
        await ln.fetch();
        setInvoice(
          await ln.requestInvoice({
            satoshi: 1,
            comment: 'Paid with Bitcoin Connect (React Demo)',
          })
        );
      } catch (error) {
        console.error(error);
      }
    })();
  }, []);

  React.useEffect(() => {
    if (invoice) {
      const checkPaymentInterval = setInterval(async () => {
        if (invoice.preimage) {
          setPreimage(invoice.preimage);
          clearInterval(checkPaymentInterval);
          if (paymentModalSetPaidFunction) {
            paymentModalSetPaidFunction({
              preimage: invoice.preimage,
            });
          }
        }
        try {
          await invoice.verifyPayment();
        } catch (error) {
          console.error(error);
        }
      }, 1000);
      return () => {
        clearInterval(checkPaymentInterval);
      };
    }
  }, [invoice, paymentModalSetPaidFunction]);

  async function payInvoice() {
    try {
      if (!invoice) {
        throw new Error('No invoice available');
      }
      const provider = await requestProvider();
      const result = await provider.sendPayment(invoice.paymentRequest);
      setPreimage(result?.preimage);
      if (!result?.preimage) {
        throw new Error('Payment failed. Please try again');
      }
    } catch (error) {
      alert(error);
    }
  }

  async function makeInvoice() {
    try {
      const provider = await requestProvider();
      const invoice = await provider.makeInvoice({
        amount: 10,
        defaultMemo: 'Paid with Bitcoin Connect (React Demo)',
      });
      setCreatedInvoice(invoice.paymentRequest);
    } catch (error) {
      alert(error);
    }
  }

  async function lookupUser() {
    if (!umaAddress) {
      alert('Please enter UMA address');
      return;
    }
    try {
      const provider = await requestProvider();
      if (!provider.lookupUser) {
        throw new Error('Provider does not support lookupUser');
      }
      const result = await provider.lookupUser({lud16: umaAddress});
      setLookupResult(JSON.stringify(result, null, 2));
      setQuoteCurrency(result.currencies[0].code);
    } catch (error) {
      alert(error);
    }
  }

  async function fetchQuote() {
    try {
      const provider = await requestProvider();
      if (!provider.fetchQuote) {
        throw new Error('Provider does not support fetchQuote');
      }
      if (!quoteAmount || isNaN(quoteAmount)) {
        throw new Error('Please enter amount');
      }
      if (quoteAmount < 0) {
        throw new Error('Amount should be greater than 0');
      }
      if (lookupResult === undefined) {
        throw new Error('Please lookup user first');
      }
      if (!umaAddress) {
        throw new Error('Please enter UMA address');
      }
      const lookupResultObject = JSON.parse(lookupResult);
      if (!lookupResultObject || !lookupResultObject.currencies) {
        throw new Error('Invalid lookup result');
      }
      const firstCurrencyCode = lookupResultObject.currencies[0].code;
      const result = await provider.fetchQuote({
        lockedCurrencyAmount: quoteAmount,
        receivingCurrencyCode: quoteCurrency || firstCurrencyCode,
        sendingCurrencyCode: 'SAT',
        receivingAddress: umaAddress,
        lockedCurrencySide: 'RECEIVING',
      });
      console.log(result);
      setQuoteResult(JSON.stringify(result, null, 2));
    } catch (error) {
      alert(error);
    }
  }

  async function executeQuote() {
    try {
      const provider = await requestProvider();
      if (!provider.executeQuote) {
        throw new Error('Provider does not support executeQuote');
      }
      if (!quoteResult) {
        throw new Error('Please fetch quote first');
      }
      const result = await provider.executeQuote({
        paymentHash: JSON.parse(quoteResult).paymentHash,
      });
      alert(`Success! ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      alert(error);
    }
  }

  const paymentResponse = React.useMemo(
    () => (preimage ? {preimage} : undefined),
    [preimage]
  );

  return (
    <>
      <Toaster />
      <h1>Bitcoin Connect React</h1>
      <Button
        onConnected={(provider) => {
          console.log('WebLN connected', provider);
          toast('<Button/>: Connected!');
        }}
        onConnecting={() => toast('<Button/>: Connecting!')}
        onDisconnected={() => toast('<Button/>: Disconnected!')}
        onModalOpened={() => toast('<Button/>: Modal opened!')}
        onModalClosed={() => toast('<Button/>: Modal closed!')}
      />
      <br />
      <PayButton
        invoice={invoice?.paymentRequest}
        onPaid={(response) => toast('<PayButton/>: Paid! ' + response.preimage)}
        onClick={() => toast('<PayButton/>: Clicked!')}
        payment={paymentResponse}
      />
      <div style={{marginTop: '16px'}}>
        {preimage ? (
          <p>
            Paid! ✅<br />
            <span style={{fontSize: '10px'}}>Preimage: {preimage}</span>
          </p>
        ) : invoice ? (
          <button onClick={payInvoice}>
            Pay 1 sat to hello@getalby.com (with requestProvider)
          </button>
        ) : (
          <p>Loading invoice...</p>
        )}
      </div>
      <button style={{marginTop: '16px'}} onClick={() => launchModal()}>
        Programmatically launch modal
      </button>
      <br />
      <button
        style={{marginTop: '16px'}}
        onClick={() => {
          if (!invoice) {
            alert('Invoice not ready yet');
            return;
          }
          const {setPaid} = launchPaymentModal({
            invoice: invoice.paymentRequest,
            onPaid: (response) => {
              toast('launchPaymentModal(): onPaid ' + response.preimage);
              setPreimage(response.preimage);
            },
            onCancelled: () => toast(`launchPaymentModal(): cancelled`),
          });
          setPaymentModalSetPaidFunction(() => setPaid);
        }}
      >
        Programmatically launch modal to pay invoice (LNURL-verify)
      </button>
      <br />
      <button style={{marginTop: '16px'}} onClick={makeInvoice}>
        Make invoice
      </button>
      {createdInvoice && <p>Created invoice: {createdInvoice}</p>}
      <br />
      <input
        type="text"
        placeholder="Enter UMA address to lookup"
        value={umaAddress}
        onChange={(e) => setUmaAddress(e.target.value)}
      />
      <button style={{marginTop: '16px'}} onClick={lookupUser}>
        Lookup user
      </button>
      <br />
      {lookupResult && (
        <div>
          <pre>{lookupResult}</pre>
          <br />
          <select onChange={(e) => setQuoteCurrency(e.target.value)}>
            {JSON.parse(lookupResult).currencies.map(
              (currency: {code: string; name: string}) => (
                <option key={currency.code} value={currency.code}>
                  {currency.name}
                </option>
              )
            )}
          </select>
          <input
            type="number"
            placeholder="Enter amount to quote"
            value={quoteAmount}
            onChange={(e) => setQuoteAmount(Number(e.target.value))}
          />
          <button onClick={fetchQuote}>Fetch quote</button>
          <br />
          {quoteResult && (
            <div>
              <pre>{quoteResult}</pre>
              <br />
              <button onClick={executeQuote}>Pay with quote</button>
            </div>
          )}
        </div>
      )}
      <br />
      <div style={{maxWidth: '448px'}}>
        <h2>Connect component</h2>
        <Connect />
        <br />
        <h2>Send payment component</h2>
        {invoice && (
          <Payment
            invoice={invoice.paymentRequest}
            onPaid={(response) =>
              toast('<Payment/>: Paid! ' + response.preimage, {
                style: {
                  wordBreak: 'break-all',
                },
              })
            }
            payment={paymentResponse}
          />
        )}
      </div>
    </>
  );
}

export default App;
