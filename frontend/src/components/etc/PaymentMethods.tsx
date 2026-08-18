import React from 'react'

function PaymentMethods() {
  return (
    <div className='flex flex-col gap-2 my-10'>
        <div className='text-xl text-gray-700 dark:text-gray-300 text-center'>Payments securely processed via Stripe. We accept all major credit/debit cards.</div>
        <div className='w-full flex gap-3 items-center justify-center'>
            <img src="https://cdn.jsdelivr.net/gh/aaronfagan/svg-credit-card-payment-icons/flat/visa.svg" alt="Visa" className="h-7 w-auto" />
            <img src="https://cdn.jsdelivr.net/gh/aaronfagan/svg-credit-card-payment-icons/flat/mastercard.svg" alt="Mastercard" className="h-7 w-auto" />
            <img src="https://cdn.jsdelivr.net/gh/aaronfagan/svg-credit-card-payment-icons/flat/amex.svg" alt="American Express" className="h-7 w-auto" />
            <img src="https://cdn.jsdelivr.net/gh/aaronfagan/svg-credit-card-payment-icons/flat/discover.svg" alt="Discover" className="h-7 w-auto" />
            <img src="https://cdn.jsdelivr.net/gh/aaronfagan/svg-credit-card-payment-icons/flat/jcb.svg" alt="JCB" className="h-7 w-auto" />
        </div>
    </div>
  )
}

export default PaymentMethods