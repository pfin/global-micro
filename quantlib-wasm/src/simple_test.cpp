#include <emscripten/bind.h>
#include <cmath>
#include <string>
#include <vector>

using namespace emscripten;

// Simple test function
double addNumbers(double a, double b) {
    return a + b;
}

// Simple discount factor calculation (no QuantLib)
double calculateDiscountFactor(double rate, double time) {
    return std::exp(-rate * time);
}

// Simple date as string
std::string getCurrentDateString() {
    return "2025-01-03"; // Hardcoded for now
}

// Simple yield curve class (no QuantLib dependencies)
class SimpleYieldCurve {
private:
    std::vector<double> times;
    std::vector<double> rates;
    
public:
    SimpleYieldCurve() {}
    
    void addPoint(double time, double rate) {
        times.push_back(time);
        rates.push_back(rate);
    }
    
    double interpolateRate(double time) {
        if (times.empty()) return 0.0;
        if (times.size() == 1) return rates[0];
        
        // Find the right interval
        for (size_t i = 1; i < times.size(); ++i) {
            if (time <= times[i]) {
                // Linear interpolation
                double t0 = times[i-1];
                double t1 = times[i];
                double r0 = rates[i-1];
                double r1 = rates[i];
                
                double alpha = (time - t0) / (t1 - t0);
                return r0 + alpha * (r1 - r0);
            }
        }
        
        // Extrapolate using last rate
        return rates.back();
    }
    
    double discount(double time) {
        double rate = interpolateRate(time);
        return calculateDiscountFactor(rate, time);
    }
    
    int getPointCount() {
        return times.size();
    }
    
    void clear() {
        times.clear();
        rates.clear();
    }
};

EMSCRIPTEN_BINDINGS(simple_quantlib_module) {
    // Basic functions
    function("addNumbers", &addNumbers);
    function("calculateDiscountFactor", &calculateDiscountFactor);
    function("getCurrentDateString", &getCurrentDateString);
    
    // Simple yield curve class
    class_<SimpleYieldCurve>("SimpleYieldCurve")
        .constructor<>()
        .function("addPoint", &SimpleYieldCurve::addPoint)
        .function("interpolateRate", &SimpleYieldCurve::interpolateRate)
        .function("discount", &SimpleYieldCurve::discount)
        .function("getPointCount", &SimpleYieldCurve::getPointCount)
        .function("clear", &SimpleYieldCurve::clear);
}