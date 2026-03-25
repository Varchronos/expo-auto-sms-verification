import ExpoModulesCore

public class ExpoAutoSmsVerificationModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoAutoSmsVerification")

    Events("onSmsReceived", "onSmsTimeout", "onSmsError")

    AsyncFunction("startSmsRetriever") { () throws in
      throw UnavailabilityError()
    }

    AsyncFunction("stopSmsRetriever") { () throws in
      throw UnavailabilityError()
    }

    AsyncFunction("getMessageHash") { () throws -> [String] in
      throw UnavailabilityError()
    }
  }
}
