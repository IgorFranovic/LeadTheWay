from math import sqrt
import random


populationSize = 9
mutationProbability = 0.8


def randomPopulation(n):
    population = []
    for i in range(populationSize):
        individual = [x for x in range(n)]
        for j in range(n-1):
            k = random.randrange(j+1, n)
            temp = individual[j]
            individual[j] = individual[k]
            individual[k] = temp
        population.append(individual)
    return population


def L2(point1, point2):
    """za sad se ne koristi ali moze nedje zatrebati"""
    return sqrt(pow(point2[0]-point1[0], 2) + pow(point2[1]-point1[1], 2))


def fitness(individual, W):
    n = len(W)
    sum = 0.0
    for i in range(n - 1):
        sum += W[individual[i]][individual[i+1]]
    sum += W[individual[n-1]][individual[0]]
    return n/sum


def randomSelection(population, W):
    fitnessSum = 0
    for individual in population:
        fitnessSum += fitness(individual, W)
    pivot = random.uniform(0, fitnessSum)
    partialSum = 0
    for individual in population:
        partialSum += fitness(individual, W)
        if partialSum >= pivot:
            return individual


def partiallyMappedCrossover(x, y):
    n = len(x)
    crossoverPoint1 = random.randrange(0, n)
    if crossoverPoint1 <= n//2:
        crossoverPoint2 = random.randrange(crossoverPoint1+1, n)
    else:
        crossoverPoint2 = crossoverPoint1
        crossoverPoint1 = random.randrange(0, crossoverPoint2)
    child1 = [-1 for i in range(n)]
    child1[crossoverPoint1:crossoverPoint2+1] = x[crossoverPoint1:crossoverPoint2+1]
    for t in y[crossoverPoint1:crossoverPoint2+1]:
        if t not in x[crossoverPoint1:crossoverPoint2+1]:
            ind = y.index(t)
            while crossoverPoint1 <= ind and ind <= crossoverPoint2:
                temp = x[ind]
                ind = y.index(temp)
            child1[ind] = t
    for i in range(n):
        if child1[i] == -1:
            child1[i] = y[i]
    child2 = [-1 for i in range(n)]
    child2[crossoverPoint1:crossoverPoint2 + 1] = y[crossoverPoint1:crossoverPoint2 + 1]
    for t in x[crossoverPoint1:crossoverPoint2 + 1]:
        if t not in y[crossoverPoint1:crossoverPoint2 + 1]:
            ind = x.index(t)
            while crossoverPoint1 <= ind and ind <= crossoverPoint2:
                temp = y[ind]
                ind = x.index(temp)
            child2[ind] = t
    for i in range(n):
        if child2[i] == -1:
            child2[i] = x[i]
    children = [child1, child2]
    return children


def mutation(child):
    n = len(child)
    mutationPoint1 = random.randrange(0, n)
    mutationPoint2 = random.randrange(0, n)
    temp = child[mutationPoint1]
    child[mutationPoint1] = child[mutationPoint2]
    child[mutationPoint2] = temp


def geneticAlgorithm(W, max_iter):
    n = len(W)
    population = randomPopulation(n)
    for cnt in range(max_iter):
        eliteIndividual = population[0]
        print('iter', cnt, ': ', eliteIndividual)
        for i in range(1, populationSize):
            if fitness(population[i], W) > fitness(eliteIndividual, W):
                eliteIndividual = population[i]
        newPopulation = []
        newPopulation.append(eliteIndividual)
        for i in range(populationSize//2):
            x = randomSelection(population, W)
            y = randomSelection(population, W)
            children = partiallyMappedCrossover(x, y)
            if random.random() < mutationProbability:
                mutation(children[0])
            if random.random() < mutationProbability:
                mutation(children[1])
            newPopulation += children
        population = newPopulation
    return population[0]