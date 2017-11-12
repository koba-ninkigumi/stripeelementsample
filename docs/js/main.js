// Handle real-time validation errors from the card Element.
card.addEventListener('change', function(event) {
  var displayError = document.getElementById('card-errors');
  if (event.error) {
    displayError.textContent = event.error.message;
  } else {
    displayError.textContent = '';
  }
});

// Handle form submission
var form = document.getElementById('payment-form');
form.addEventListener('submit', function(event) {
  event.preventDefault();

  const paymentRequest = {
    card: card,
    currency: 'JPY',
    amount: 5000 * 100,
    nativeElement: document.querySelector('#iframe-payment'),
    ownerInfo: {
      owner: {
        name: 'Jhon Doe',
        email: 'jhon.doe@example.com'
      }
    }

  };

  paymentRequest.nativeElement.innerHTML = 'Loading... Please wait...';

  //authwindow = window.open("callback.html?client_secret=src_client_secret_XXXXX&livemode=false&source=src_XXXXXX", "threedsecure" );
  authwindow = window.open("waiting.html", "threedsecure" );

  doPayment(paymentRequest).then((result) => {
    console.log('result --> ', result);
    paymentRequest.nativeElement.innerHTML = 'Success!!!! Your details are correct!!! :)';
    //alert('Success: Token is: ' + result.id);
    console.log('Success: Token is: ' + result.id);
    // ここでFirebaseに格納
  }).catch((error) => {
    authwindow.close();
    console.log(error);
    paymentRequest.nativeElement.innerHTML = 'Ups! We can\t validate your details...';
    alert('Ups, something wrong, sorry! :(');
  });

});
