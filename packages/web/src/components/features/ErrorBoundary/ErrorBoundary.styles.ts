import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    padding: 32,
    textAlign: "center",
    backgroundColor: "#ffffff",
    minHeight: "100vh",
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    color: "#000000",
  },
  message: {
    color: "#666666",
    fontSize: 16,
    maxWidth: 500,
    marginHorizontal: "auto",
    marginBottom: 32,
  },
  details: {
    color: "#666666",
    fontSize: 14,
    textAlign: "left",
  },
  summary: {
    cursor: "pointer",
    padding: 8,
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#cccccc",
  },
  pre: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#cccccc",
    fontSize: 12,
  },
});
