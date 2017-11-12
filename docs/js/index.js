'use strict';

let authwindow = {};

var stripe = Stripe('pk_test_f9oZhmpCiZchUL8MtnuVGefH');

function registerElements(elements, exampleName) {
  var formClass = '.' + exampleName;
  var example = document.querySelector(formClass);

  var form = example.querySelector('form');
  var resetButton = example.querySelector('a.reset');
  var error = form.querySelector('.error');
  var errorMessage = error.querySelector('.message');

  function enableInputs() {
    Array.prototype.forEach.call(
      form.querySelectorAll(
        "input[type='text'], input[type='email'], input[type='tel']"
      ),
      function(input) {
        input.removeAttribute('disabled');
      }
    );
  }

  function disableInputs() {
    Array.prototype.forEach.call(
      form.querySelectorAll(
        "input[type='text'], input[type='email'], input[type='tel']"
      ),
      function(input) {
        input.setAttribute('disabled', 'true');
      }
    );
  }

  // Listen for errors from each Element, and show error messages in the UI.
  elements.forEach(function(element) {
    element.on('change', function(event) {
      if (event.error) {
        error.classList.add('visible');
        errorMessage.innerText = event.error.message;
      } else {
        error.classList.remove('visible');
      }
    });
  });

  // Listen on the form's 'submit' handler...
  form.addEventListener('submit', function(e) {
    e.preventDefault();

    // Show a loading screen...
    example.classList.add('submitting');

    // Disable all inputs.
    disableInputs();

    // Gather additional customer data we may have collected in our form.
    var name = form.querySelector('#' + exampleName + '-name');
    var email = form.querySelector('#' + exampleName + '-email');
    var address1 = form.querySelector('#' + exampleName + '-address');
    var city = form.querySelector('#' + exampleName + '-city');
    var state = form.querySelector('#' + exampleName + '-state');
    var zip = form.querySelector('#' + exampleName + '-zip');
    var additionalData = {
      name: name ? name.value : undefined,
      email: email ? email.value : undefined,
      address_line1: address1 ? address1.value : undefined,
      address_city: city ? city.value : undefined,
      address_state: state ? state.value : undefined,
      address_zip: zip ? zip.value : undefined,
    };

/*
    // Use Stripe.js to create a token. We only need to pass in one Element
    // from the Element group in order to create a token. We can also pass
    // in the additional customer data we collected in our form.
    stripe.createToken(elements[0], additionalData).then(function(result) {
      // Stop loading!
      example.classList.remove('submitting');

      if (result.token) {
        // If we received a token, show the token ID.
        example.querySelector('.token').innerText = result.token.id;
        example.classList.add('submitted');
      } else {
        // Otherwise, un-disable inputs.
        enableInputs();
      }
    });
*/

    const paymentRequest = {
      card: elements[0],
      currency: 'JPY',
      amount: 5000 * 100,
      nativeElement: document.querySelector('#iframe-payment'),
      ownerInfo: {
        owner: additionalData
      }

    };

    authwindow = window.open("waiting.html", "threedsecure" );

    doPayment(paymentRequest).then((result) => {
      example.classList.remove('submitting');
      console.log('result --> ', result);


      if (result.id) {
        // If we received a token, show the token ID.
        example.querySelector('.token').innerText = result.id;
        example.classList.add('submitted');
      } else {
        // Otherwise, un-disable inputs.
        enableInputs();
      }


      //paymentRequest.nativeElement.innerHTML = 'Success!!!! Your details are correct!!! :)';
      //alert('Success: Token is: ' + result.id);
      console.log('Success: Token is: ' + result.id);
      // ここでFirebaseに格納
    }).catch((error) => {
      enableInputs();
      example.classList.remove('submitting');
      authwindow.close();
      console.log(error);
      //paymentRequest.nativeElement.innerHTML = 'Ups! We can\t validate your details...';
      alert('Ups, something wrong, sorry! :(');
    });


  });

  resetButton.addEventListener('click', function(e) {
    e.preventDefault();
    // Resetting the form (instead of setting the value to `''` for each input)
    // helps us clear webkit autofill styles.
    form.reset();

    // Clear each Element.
    elements.forEach(function(element) {
      element.clear();
    });

    // Reset error state as well.
    error.classList.remove('visible');

    // Resetting the form does not un-disable inputs, so we need to do it separately:
    enableInputs();
    example.classList.remove('submitted');
  });
}

function doPayment(paymentRequest) {
  return new Promise((resolve, reject) => {
    stripe.createSource(paymentRequest.card, paymentRequest.ownerInfo).then(function(result) {
      console.log(result)
      if (result.error) {
        // Inform the user if there was an error
        var errorElement = document.getElementById('card-errors');
        errorElement.textContent = result.error.message;
        reject(result.error);
      } else if (result.source.card.three_d_secure === 'not_supported' && result.source.status === 'chargeable'){
        authwindow.close();
        resolve( result.source );
      } else if (result.source.card.three_d_secure === 'optional' || result.source.card.three_d_secure === 'required'){

        paymentRequest.source = result;

        createThreeDSecureSource(paymentRequest).then((result)=>{
          console.log(result);

          resolve(result);
        }).catch((error) => {
          console.log(error);
          reject(error)
        });

      } else {
        reject(result);
      }
    });
  });
}

function createThreeDSecureSource(paymentRequest){
  console.log('create3DSecure --> paymentRequest', paymentRequest);
  return new Promise((resolve, reject) => {
    stripe.createSource({
      type: 'three_d_secure',
      amount: paymentRequest.amount,
      currency: paymentRequest.currency,
      three_d_secure: {
        card: paymentRequest.source.source.id
      },
      redirect: {
        //return_url: window.location.href
        return_url: window.location.href.substring(0, window.location.href.lastIndexOf('/')) + "/callback.html"
      }
    }).then(function(result) {
      console.log('create3DSecure --> createSourceResponse', result);

      // handle result.error or result.source
      if (result.error) {
        // Inform the user if there was an error
        var errorElement = document.getElementById('card-errors');
        errorElement.textContent = result.error.message;
        console.log(result.error);
        reject(result.error);
      }

      paymentRequest.threeDSecure = result;

      /*
      var iframe = document.createElement("iframe");
      paymentRequest.nativeElement.replaceChild(iframe, paymentRequest.nativeElement.childNodes.item(0));
      iframe.style.width = "100%";
      iframe.style.height = "800px";
      iframe.frameBorder = "0";
      iframe.seamless = true;
      iframe.addEventListener('load',()=>{
        retrieveSource(result.source.id, result.source.client_secret).then((result)=>{
          resolve(result);
        });
      });
      iframe.src = result.source.redirect.url;
      */

      authwindow.location.href = result.source.redirect.url;

      //ここにaddeventlistener
      receiveMessageFromAuthWindow(result).then((result2)=>{
        console.log(result2);
        resolve(result2);
      }).catch((error) => {
        console.log(error);
        reject(error)
      });

    });
  });
}

function receiveMessageFromAuthWindow(result){
  return new Promise((resolve, reject) => {
        window.addEventListener('message', (evt)=>{
          if (evt.data === "threedsecurecredentialcallback"){
            console.log(evt.data);
            console.log(authwindow.location);
            if (typeof(authwindow.close) === 'function' && authwindow.location.pathname === '/callback.html'){
              authwindow.close();
            }
            console.log(JSON.parse(localStorage.getItem("threedsecurecredential")));
            //document.querySelector("#postmessage").innerHTML = localStorage.getItem("threedsecurecredential");
            localStorage.setItem("threedsecurecredential",'{}');

            retrieveSource(result.source.id, result.source.client_secret).then((result2)=>{
              console.log(result2);
              //resolve("あいうえお");
              resolve(result2);
            }).catch((error) => {
              console.log(error);
              reject(error)
            });


          }
        });
  });

}


function retrieveSource(id, client_secret){
  return new Promise((resolve, reject) => {
    stripe.retrieveSource({
      id: id,
      client_secret: client_secret,
    }).then(function(result) {
      // Handle result.error or result.source
      if (result.error) {
        // Inform the user if there was an error
        var errorElement = document.getElementById('card-errors');
        errorElement.textContent = result.error.message;
        console.log(result.error);
        reject(result.error);
      } else if (result.source.status === 'canceled' || result.source.status === 'consumed' || result.source.status === 'failed') {
        console.log('onPoolCallback --> REJECT --> canceled/consumed/fail --> ', result.source);
        reject(result.source.status);
      } else if (/* result.source.three_d_secure.authenticated && */ result.source.status === 'chargeable') {
        /* some cards do not need to be authenticated, like the 4242 4242 4242 4242 */
        console.log('onPoolCallback --> SUCCESS --> ', result);
        resolve(result.source);
      }
    });

  });
}
