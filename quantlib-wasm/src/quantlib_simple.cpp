#include <emscripten/bind.h>
#include <ql/quantlib.hpp>
#include <string>
#include <vector>

using namespace emscripten;
using namespace QuantLib;

// Simple test function
double addNumbers(double a, double b) {
    return a + b;
}

// Basic QuantLib date functionality
std::string getCurrentDate() {
    Date today = Date::todaysDate();
    return today.ISO();
}

// Simple discount factor calculation
double calculateDiscountFactor(double rate, double time) {
    Rate r = rate;
    Time t = time;
    return std::exp(-r * t);
}

// Basic yield curve point
struct YieldPoint {
    double time;
    double rate;
    
    YieldPoint(double t, double r) : time(t), rate(r) {}
};

// Simple yield curve class
class SimpleYieldCurve {
private:
    std::vector<YieldPoint> points;
    
public:
    SimpleYieldCurve() {}
    
    void addPoint(double time, double rate) {
        points.push_back(YieldPoint(time, rate));
    }
    
    double interpolateRate(double time) {
        if (points.empty()) return 0.0;
        if (points.size() == 1) return points[0].rate;
        
        // Simple linear interpolation
        for (size_t i = 1; i < points.size(); ++i) {
            if (time <= points[i].time) {
                double t0 = points[i-1].time;
                double t1 = points[i].time;
                double r0 = points[i-1].rate;
                double r1 = points[i].rate;
                
                double alpha = (time - t0) / (t1 - t0);
                return r0 + alpha * (r1 - r0);
            }
        }
        
        return points.back().rate;
    }
    
    double discount(double time) {
        double rate = interpolateRate(time);
        return calculateDiscountFactor(rate, time);
    }
    
    int getPointCount() {
        return points.size();
    }
};

EMSCRIPTEN_BINDINGS(quantlib_module) {
    // Basic functions
    function("addNumbers", &addNumbers);
    function("getCurrentDate", &getCurrentDate);
    function("calculateDiscountFactor", &calculateDiscountFactor);
    
    // Simple yield curve class
    class_<SimpleYieldCurve>("SimpleYieldCurve")
        .constructor<>()
        .function("addPoint", &SimpleYieldCurve::addPoint)
        .function("interpolateRate", &SimpleYieldCurve::interpolateRate)
        .function("discount", &SimpleYieldCurve::discount)
        .function("getPointCount", &SimpleYieldCurve::getPointCount);
}