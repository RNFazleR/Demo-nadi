// Wadah seukuran HP: full-width di mobile, di tengah dengan bingkai di laptop.
export default function PhoneFrame({ children }) {
  return (
    <div className="min-h-dvh sm:flex sm:items-center sm:justify-center sm:py-8">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-canvas sm:h-[min(52rem,calc(100dvh-4rem))] sm:min-h-0 sm:overflow-y-auto sm:rounded-sheet sm:[scrollbar-width:none] sm:shadow-phone">
        {children}
      </div>
    </div>
  )
}
