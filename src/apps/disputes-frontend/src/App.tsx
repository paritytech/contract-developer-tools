import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { NetworkProvider } from "./context/NetworkContext.tsx";
import { TransactionProvider } from "./context/TransactionContext.tsx";
import Navbar from "./components/Navbar.tsx";
import TransactionTracker from "./components/TransactionTracker.tsx";
import DisputesPage from "./pages/DisputesPage.tsx";
import DisputeDetailPage from "./pages/DisputeDetailPage.tsx";

function App() {
    return (
        <ThemeProvider>
            <Router>
                <NetworkProvider>
                    <TransactionProvider>
                        <div className="min-h-screen bg-bg text-text-primary flex flex-col">
                            <Navbar />
                            <main className="flex-1 dot-grid">
                                <Routes>
                                    <Route path="/" element={<DisputesPage />} />
                                    <Route
                                        path="/disputes/:contextId/:disputeId"
                                        element={<DisputeDetailPage />}
                                    />
                                </Routes>
                            </main>
                            <TransactionTracker />
                        </div>
                    </TransactionProvider>
                </NetworkProvider>
            </Router>
        </ThemeProvider>
    );
}

export default App;
