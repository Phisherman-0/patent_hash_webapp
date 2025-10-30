import { ReactNode } from "react"
import { WalletConnectContextProvider } from "../../contexts/WalletConnectContext"
import { WalletConnectClient } from "./walletConnectClient"

// This provider wraps all wallet-related context providers and clients
// It ensures proper initialization order and prevents conflicts
export const AllWalletsProvider = (props: {
  children: ReactNode | undefined
}) => {
  return (
    <WalletConnectContextProvider>
      <WalletConnectClient />
      {props.children}
    </WalletConnectContextProvider>
  )
}
